"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Plus,
  Loader2,
  Edit,
  Link as LinkIcon,
  X,
} from "lucide-react";
import { UploadComponent } from "@/components/upload/UploadComponent";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { fetchBlogs, deleteBlog, bulkDeleteBlogs } from "@/app/actions/adminOps";
import { updateBlogMetadata, getAllNextSteps } from "@/app/actions/blogOps";
import { Admins, Comment, BlogCategory, BlogAudience } from "@/app/generated/prisma/browser";
import { formatBlogCategory, formatBlogAudience, cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// Import necessary ShadCN UI components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BlogwithComments } from "@/app/actions/blogOps";
import { toast } from "sonner";
import { AlertDialogOverlay } from "@radix-ui/react-alert-dialog";

export type BlogDisplay = Omit<BlogwithComments, "content">;

// --- MAIN COMPONENT ---
export default function BlogsDashboardPage() {
  const { session } = useAuth();
  const [blogs, setBlogs] = useState<BlogDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedComments, setSelectedComments] = useState<Comment[]>([]);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<BlogDisplay | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 40,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Quick Edit State
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [quickEditBlog, setQuickEditBlog] = useState<BlogDisplay | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [allNextSteps, setAllNextSteps] = useState<any[]>([]);
  const [useUpload, setUseUpload] = useState(false);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchData() {
      setLoading(true);
      try {
          const [fetchedBlogs, fetchedSteps] = await Promise.all([
              fetchBlogs(),
              getAllNextSteps()
          ]);
          setBlogs(fetchedBlogs ? fetchedBlogs : []);
          setAllNextSteps(fetchedSteps || []);
      } catch (err) {
          console.error("Failed to load dashboard data", err);
      } finally {
          setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Memoize columns to prevent re-creation on every render
  const columns = useMemo<ColumnDef<BlogDisplay>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.title}</div>
        ),
      },
      {
        accessorKey: "categories",
        header: "Categories",
        cell: ({ row }) => {
          const primary = row.original.category;
          const subs = row.original.categories.filter(c => c !== primary);
          return (
            <div className="flex flex-wrap gap-1">
              <Badge variant="default" className="bg-[#5C9952] text-white">
                {formatBlogCategory(primary)}
              </Badge>
              {/* {subs.map(c => (
                <Badge key={c} variant="outline" className="opacity-70">
                  {formatBlogCategory(c)}
                </Badge>
              ))} */}
            </div>
          );
        },
        // Enable search on categories by returning a joined string
        accessorFn: (row) => [row.category, ...row.categories].map(formatBlogCategory).join(" "),
      },
      {
        accessorKey: "published",
        header: "Status",
        cell: ({ row }) => {
          const isPublished = row.original.published;
          const blogId = row.original.cuid;

          const handleToggle = async (checked: boolean) => {
            try {
              const res = await updateBlogMetadata(blogId, { published: checked });
              if (res.success) {
                setBlogs(prev => prev.map(b => b.cuid === blogId ? { ...b, published: checked } : b));
                toast.success(`Blog ${checked ? 'published' : 'unpublished'} successfully.`);
              } else {
                toast.error("Failed to update status.");
              }
            } catch (err) {
              toast.error("An error occurred.");
            }
          };

          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={isPublished}
                onCheckedChange={handleToggle}
                style={{ backgroundColor: isPublished ? "#5C9952" : "#fff", height: "20px" }}
              />
              <span className="text-xs font-medium opacity-70">
                {isPublished ? "Published" : "Draft"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
      },
      {
        accessorKey: "views",
        header: "Views",
      },
      {
        accessorKey: "likes",
        header: "Likes",
      },
      {
        accessorKey: "comments",
        header: "Comments",
        cell: ({ row }) => (
          <Button
            variant="link"
            className="p-0"
            onClick={() => {
              setSelectedComments(row.original.comments);
              setIsCommentDialogOpen(true);
            }}
          >
            View ({row.original.comments.length})
          </Button>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className=" bg-white">
              <DropdownMenuItem
                className="cursor-pointer tap-dark hover:bg-green-400/10"
                onClick={() => {
                  setQuickEditBlog(row.original);
                  setEditFormData({
                    title: row.original.title,
                    subtitle: row.original.subtitle,
                    category: row.original.category,
                    categories: row.original.categories || [],
                    audience: row.original.audience,
                    excerpt: row.original.excerpt,
                    featured: row.original.featured,
                    nextSteps: (row.original.nextSteps || []).map((s: any) => s.id),
                    image: row.original.image,
                  });
                  setUseUpload(false);
                  setDismissedUrl(null);
                  setIsQuickEditOpen(true);
                }}
              >
                <MoreHorizontal className="mr-2 h-4 w-4" />
                Quick Edit
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer tap-dark hover:bg-blue-400/10 ">
                <Link href={`/blogs/edit/${row.original.slug}`} className="flex items-center w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Full Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500 cursor-pointer hover:bg-red-500/10"
                onClick={() => setBlogToDelete(row.original)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: blogs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: setPagination,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      pagination,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
  });

  const handleQuickSave = async () => {
    if (!quickEditBlog) return;
    setIsSaving(true);
    try {
      const res = await updateBlogMetadata(quickEditBlog.cuid, editFormData);
      if (res.success) {
        // We need the full blog objects to update local state if nextSteps or categories changed
        // but for now let's just update what we have.
        setBlogs(prev => prev.map(b => b.cuid === quickEditBlog.cuid ? { 
          ...b, 
          ...editFormData,
          // Since updateBlogMetadata returns the updated blog, we could use that
          // but let's just re-fetch to be safe and accurate with relations
        } : b));
        
        // Hard Refresh to ensure all relations are correct in the table
        const updated = await fetchBlogs();
        setBlogs(updated || []);
        
        toast.success("Blog metadata updated successfully.");
        setIsQuickEditOpen(false);
      } else {
        toast.error("Failed to update blog metadata.");
      }
    } catch (err) {
      toast.error("An error occurred during save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (blogToDelete) {
      try {
        await deleteBlog(blogToDelete.cuid, session as Admins);
        const updatedBlogs = blogs.filter(
          (blog) => blog.cuid !== blogToDelete.cuid
        );
        setBlogs(updatedBlogs);
        toast.success("Blog deleted successfully.");
      } catch (e) {
        toast.error("Failed to delete blog. Please try again.");
        console.error(e);
      } finally {
        setBlogToDelete(null);
      }
    }
  };


  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => row.original.id);

    if (ids.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const result = await bulkDeleteBlogs(ids, session as Admins);
      if (result) {
        setBlogs(blogs.filter((blog) => !ids.includes(blog.id)));
        setRowSelection({});
        toast.success(`Successfully deleted ${ids.length} blogs.`);
      } else {
        toast.error("Failed to delete blogs in bulk.");
      }
    } catch (e) {
      toast.error("An error occurred during bulk deletion.");
      console.error(e);
    } finally {
      setIsBulkDeleting(false);
      setIsBulkDeleteAlertOpen(false);
    }
  };

  // Loading state UI
  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container tap-dark mx-auto py-8 px-6 min-h-full ">
      <div className="flex items-center justify-between mx-auto">
        <h1 className="text-3xl font-bold mb-6 tap-dark">Manage Blogs</h1>
        <div className="flex items-center gap-3">
          <Link href="/blog-next-steps">
            <Button variant="outline" className="border-[#5C9952] text-[#5C9952] hover:bg-[#5C9952]/10 transition-colors">
              Manage Next Steps
            </Button>
          </Link>
          <Link href="/blogs/new">
            <Button className="bg-[#5C9952] hover:bg-[#4a7c42] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create New Blog
            </Button>
          </Link>
        </div>
      </div>
      {/* Filter Input */}
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter blogs by title..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm tap-dark border-black/30 bg-white/50 backdrop-blur-sm focus:bg-white transition-all shadow-sm"
        />
        <div className="flex-1" />
        <AnimatePresence>
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRowSelection({})}
                className="text-gray-500 hover:text-gray-900 font-semibold text-xs"
              >
                Deselect
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteAlertOpen(true)}
                disabled={isBulkDeleting}
                className="flex items-center  text-red-500 font-bold border border-red-500"
              >
                {isBulkDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Selected ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Blogs Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="tap-dark font-bold">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="tap-dark">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No blogs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center px-4 space-x-2 py-4">
        <span className="text-sm text-muted-foreground tap-dark opacity-70">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <Button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {/* Comments Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="sm:max-w-[625px] border-black/30 tap-dark bg-white">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4  ">
            {selectedComments.length > 0 ? (
              <div className="space-y-4">
                {selectedComments.map((comment) => (
                  <div key={comment.id} className="text-sm border-b pb-2">
                    <p className="font-semibold">{comment.author}</p>
                    <p className="text-gray-600 mt-1">{comment.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No comments for this blog yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!blogToDelete}
        onOpenChange={() => setBlogToDelete(null)}
      >
        <AlertDialogContent className="bg-white border tap-dark border-black/10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600">
              Delete Blog Post?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
              This will permanently delete{" "}
              <span className="font-semibold text-gray-800">
                "{blogToDelete?.title}"
              </span>{" "}
              and all of its comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="border-black/10 hover:bg-gray-50">
              Keep Post
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={isBulkDeleteAlertOpen}
        onOpenChange={setIsBulkDeleteAlertOpen}
      >
        <AlertDialogContent className="bg-white border tap-dark border-black/10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600">
              Bulk Delete Blog Posts?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
              You are about to delete{" "}
              <span className="font-semibold text-gray-800">
                {table.getFilteredSelectedRowModel().rows.length}
              </span>{" "}
              blog posts. This will permanently remove them and all their comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="border-black/10 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold min-w-[120px]"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete All Selected"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Edit Sheet */}
      <Sheet open={isQuickEditOpen} onOpenChange={setIsQuickEditOpen}>
        <SheetContent side="responsive-right" className="p-0 border-none shadow-2xl bg-white flex flex-col h-full tap-dark overflow-hidden">
          <div className="flex flex-col h-full bg-gray-50/30">
            <SheetHeader className="p-8 pb-6 bg-white border-b border-gray-100">
              <SheetTitle className="text-3xl font-black text-[#2D4A29] leading-tight">Quick Edit Metadata</SheetTitle>
              <SheetDescription className="text-sm font-medium text-gray-500 mt-2">
                Update blog details without editing the full content.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-8 styled-scrollbar space-y-6">
              <div className="grid gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex items-center justify-between px-1">
                      <Label className="text-xs font-bold text-gray-700">Featured Image</Label>
                      <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] font-bold transition-colors", !useUpload ? "text-[#5C9952]" : "text-gray-400")}>URL</span>
                          <Switch 
                              checked={useUpload} 
                              onCheckedChange={setUseUpload}
                              style={{ backgroundColor: useUpload ? "#5C9952" : "#fff", height: "18px" }}
                          />
                          <span className={cn("text-[10px] font-bold transition-colors", useUpload ? "text-[#5C9952]" : "text-gray-400")}>Upload</span>
                      </div>
                  </div>

                  {useUpload ? (
                      <div className="grid gap-2">
                          <UploadComponent 
                              maxFiles={1} 
                              accept="image/*"
                              onUploadComplete={(url) => {
                                  setEditFormData({ ...editFormData, image: url });
                              }}
                          />
                      </div>
                  ) : (
                      <div className="grid gap-2">
                          <div className="relative">
                              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                  value={editFormData.image || ""}
                                  onChange={(e) => setEditFormData({ ...editFormData, image: e.target.value })}
                                  placeholder="https://example.com/image.jpg"
                                  className="border-gray-200 pl-10 h-10 rounded-xl focus:ring-gray-500 text-xs"
                              />
                          </div>
                      </div>
                  )}

                  {!useUpload && editFormData.image && editFormData.image !== dismissedUrl && (
                      <div className="mt-2 p-2 bg-white rounded-xl border border-gray-100 flex flex-col gap-2 animate-in fade-in duration-300">
                           <div className="flex items-center justify-between px-1">
                              <span className="text-[9px] font-black text-gray-400 uppercase">Image Preview</span>
                              <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-5 w-5 text-gray-400"
                                  onClick={() => setDismissedUrl(editFormData.image || null)}
                              >
                                  <X className="h-3 w-3" />
                              </Button>
                           </div>
                           <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
                              <img 
                                  src={editFormData.image} 
                                  alt="Blog featured image" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                                  }}
                              />
                           </div>
                      </div>
                  )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-xs font-bold text-gray-700">Title</Label>
                <Input
                  id="title"
                  value={editFormData.title || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="rounded-xl border-gray-100 h-12"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subtitle" className="text-xs font-bold text-gray-700">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={editFormData.subtitle || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, subtitle: e.target.value })}
                  className="rounded-xl border-gray-100 h-12"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-xs font-bold text-gray-700">Category</Label>
                  <Select
                    value={editFormData.category}
                    onValueChange={(value) => setEditFormData({ ...editFormData, category: value as BlogCategory })}
                  >
                    <SelectTrigger className="rounded-xl border-gray-100 h-12">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {Object.values(BlogCategory).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {formatBlogCategory(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="audience" className="text-xs font-bold text-gray-700">Audience</Label>
                  <Select
                    value={editFormData.audience as string}
                    onValueChange={(value) => setEditFormData({ ...editFormData, audience: value as BlogAudience })}
                  >
                    <SelectTrigger className="rounded-xl border-gray-100 h-12">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {Object.values(BlogAudience).map((aud) => (
                        <SelectItem key={aud} value={aud}>
                          {formatBlogAudience(aud)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="excerpt" className="text-xs font-bold text-gray-700">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  rows={4}
                  value={editFormData.excerpt || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, excerpt: e.target.value })}
                  className="rounded-xl border-gray-100"
                />
              </div>
              <div className="flex items-center space-x-2 p-4 bg-white border border-gray-100 rounded-2xl">
                <Switch
                  id="featured"
                  checked={editFormData.featured}
                  style={{ backgroundColor: editFormData.featured ? "#5C9952" : "#fff", height: "20px" }}
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, featured: checked })}
                />
                <Label htmlFor="featured" className="text-sm font-bold text-gray-700">Featured Post</Label>
              </div>

              {/* Multi-Categories */}
              <div className="grid gap-3">
                <Label className="text-xs font-bold text-gray-700">Additional Categories</Label>
                <div className="flex flex-wrap gap-2 p-4 bg-white border border-gray-100 rounded-2xl">
                  {Object.values(BlogCategory).filter(c => c !== editFormData.category).map((cat) => {
                    const isSelected = (editFormData.categories || []).includes(cat);
                    return (
                      <Badge
                        key={cat}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all px-3 py-1.5",
                          isSelected ? "bg-[#5C9952] text-white" : "hover:bg-gray-50 bg-white"
                        )}
                        onClick={() => {
                          const current = editFormData.categories || [];
                          const updated = isSelected 
                            ? current.filter((c: string) => c !== cat)
                            : [...current, cat];
                          setEditFormData({ ...editFormData, categories: updated });
                        }}
                      >
                        {formatBlogCategory(cat)}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Next Steps Selector */}
              <div className="grid gap-3">
                <Label className="text-xs font-bold text-gray-700">Internal Next Steps</Label>
                <div className="grid gap-2 p-4 bg-white border border-gray-100 rounded-2xl">
                  {allNextSteps.map((step) => {
                    const isSelected = (editFormData.nextSteps || []).includes(step.id);
                    return (
                      <div 
                        key={step.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group",
                          isSelected ? "border-[#5C9952] bg-[#5C9952]/5" : "border-gray-100 hover:border-gray-200"
                        )}
                        onClick={() => {
                          const current = editFormData.nextSteps || [];
                          const updated = isSelected
                            ? current.filter((id: number) => id !== step.id)
                            : [...current, step.id];
                          setEditFormData({ ...editFormData, nextSteps: updated });
                        }}
                      >
                        <div className="flex flex-col">
                          <span className={cn("text-xs font-bold", isSelected ? "text-[#5C9952]" : "text-gray-700")}>{step.title}</span>
                          <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{step.link}</span>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                          isSelected ? "bg-[#5C9952] border-[#5C9952]" : "border-gray-200 group-hover:border-gray-300"
                        )}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in-50" />}
                        </div>
                      </div>
                    );
                  })}
                  {allNextSteps.length === 0 && (
                    <p className="text-xs text-center text-gray-400 py-2">No next steps found. <Link href="/blog-next-steps" className="text-[#5C9952] underline">Create some?</Link></p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-8 bg-white border-t border-gray-100 flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsQuickEditOpen(false)}
                className="flex-1 h-14 rounded-xl border-gray-200"
              >
                Cancel
              </Button>
              <Button
                className="flex-[2] bg-[#5C9952] hover:bg-[#4a7c42] text-white h-14 rounded-xl font-bold shadow-lg transition-all active:scale-95"
                onClick={handleQuickSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// A simple skeleton component for the loading state
function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 px-6">
      <h1 className="text-3xl font-bold mb-6">
        <Skeleton className="h-8 w-48" />
      </h1>
      <div className="flex items-center py-4">
        <Skeleton className="h-10 w-80" />
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
