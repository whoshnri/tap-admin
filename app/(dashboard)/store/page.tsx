"use client";

import { useState, useMemo, useEffect, FormEvent } from "react";
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
  Edit,
  PlusCircle,
  Layers,
  LayoutGrid,
  PlusIcon,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StoreItem, Bundle, Admins } from "@/app/generated/prisma/client";
import {
  fetchItems,
  deleteItem,
  fetchBundles,
  bulkDeleteStoreItems,
  toggleStoreItemFree,
} from "@/app/actions/adminOps";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useStoreItemMutation } from "./hooks/useStoreItemMutation";
import { StoreItemSheet } from "./components/StoreItemSheet";
import { StoreItemFormData } from "./components/schema";

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
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Type for the form state, omitting the ID and createdAt
// Type for the items with bundle relation
type ItemWithBundle = StoreItem & { bundle: Bundle | null };
type ItemFormData = Omit<StoreItem, "id" | "createdAt">;

const initialFormData: ItemFormData = {
  name: "",
  imageUrl: "",
  category: "All",
  desc: "",
  price: 0,
  downloadLink: "",
  badge: "",
  goodFor: "",
  free: false,
  cta: "",
  beaconLink: "",
  parentNeeds: [],
  bundleId: null,
};

export default function StoreDashboardPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<ItemWithBundle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 40 });
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bundleFilter, setBundleFilter] = useState<"all" | "in-bundle" | "standalone">("all");
  const [freeFilter, setFreeFilter] = useState<"all" | "free" | "paid">("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "zero" | "paid">("all");

  // State for modals and dialogs
  const [itemToDelete, setItemToDelete] = useState<StoreItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<StoreItem | null>(null);
  const [viewingBundle, setViewingBundle] = useState<Bundle | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch initial data
  const loadItems = async () => {
    setLoading(true);
    const [fetchedItems, fetchedBundles] = await Promise.all([
      fetchItems(),
      fetchBundles()
    ]);
    setItems((fetchedItems as ItemWithBundle[]) || []);
    setBundles((fetchedBundles as Bundle[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const { add, update, isPending } = useStoreItemMutation(session, () => {
    loadItems();
    setIsSheetOpen(false);
    setItemToEdit(null);
  });

  const handleFormSubmit = (data: StoreItemFormData) => {
    if (itemToEdit) {
      update(itemToEdit.id, data);
    } else {
      add(data);
    }
  };

  const handleDelete = async () => {
    if (!session) return;
    if (itemToDelete) {
      const success = await deleteItem(itemToDelete.id, session);
      if (success) {
        await loadItems();
        toast.success("Item deleted successfully");
      } else {
        toast.error("Failed to delete item");
      }
      setItemToDelete(null);
    }
  };

  const columns = useMemo<ColumnDef<ItemWithBundle>[]>(
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
        accessorKey: "name",
        header: "Item",
        cell: ({ row }) => (
          <div className="flex items-center gap-4 min-w-[300px]">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-black/5 bg-muted">
              <img
                src={row.original.imageUrl}
                alt={row.original.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-semibold text-sm truncate">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.category}</Badge>
        ),
      },
      {
        accessorKey: "bundle",
        header: "Bundle",
        cell: ({ row }) => (
          row.original.bundle ? (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-sm border cursor-pointer transition-all"
                onClick={() => setViewingBundle(row.original.bundle)}
              >
                <Layers className="h-4 w-4" />
                <span className="sr-only">View Bundle: {row.original.bundle.name}</span>
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="text-[10px] text-muted-foreground/40 italic">N/A</span>
            </div>
          )
        ),
      },
      {
        accessorKey: "price",
        header: "Price / Type",
        cell: ({ row }) => {
          const item = row.original;
          const isAtb = !!item.bundleId;
          const isAbb = item.price === 0 && item.badge !== "FREE" && !isAtb;

          if (isAtb) return <Badge variant="outline" className="border-green-600 text-green-700 ">ATB</Badge>;
          if (isAbb) return <Badge variant="outline" className="border-blue-600 text-blue-700 ">ABB</Badge>;
          if (item.price === 0 && item.badge === "FREE") return <span className=" text-green-600">FREE</span>;

          return (
            <span className="">
              {new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: "GBP",
              }).format(item.price)}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Date Added",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        accessorKey: "free",
        header: "Free",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Switch
              checked={row.original.free}
              style={{ backgroundColor: row.original.free ? "#5C9952" : "#ccc" }}
              onCheckedChange={async (checked) => {
                if (!session) return;
                const success = await toggleStoreItemFree(
                  row.original.id,
                  checked,
                  session
                );
                if (success) {
                  toast.success(
                    `Item "${row.original.name}" is now ${checked ? "FREE" : "PAID"
                    }`
                  );
                  // Optimistically update the local state
                  setItems((prev) =>
                    prev.map((item) =>
                      item.id === row.original.id
                        ? { ...item, free: checked }
                        : item
                    )
                  );
                } else {
                  toast.error("Failed to update status");
                }
              }}
            />
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="tap-light-overlay bg-white border-black/30">
              <DropdownMenuItem onClick={() => {
                setItemToEdit(row.original);
                setIsSheetOpen(true);
              }}
                className="cursor-pointer hover:bg-blue-500/30"
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500 hover:bg-red-500/10 cursor-pointer"
                onClick={() => setItemToDelete(row.original)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesBundle = 
        bundleFilter === "all" ? true :
        bundleFilter === "in-bundle" ? !!item.bundleId :
        !item.bundleId;

      const matchesFree = 
        freeFilter === "all" ? true :
        freeFilter === "free" ? item.free :
        !item.free;

      const matchesPrice = 
        priceFilter === "all" ? true :
        priceFilter === "zero" ? item.price === 0 :
        item.price > 0;

      return matchesBundle && matchesFree && matchesPrice;
    });
  }, [items, bundleFilter, freeFilter, priceFilter]);

  const table = useReactTable({
    data: filteredItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: setPagination,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter, pagination, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
  });

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => row.original.id);

    if (ids.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const result = await bulkDeleteStoreItems(ids, session as Admins);
      if (result) {
        toast.success(`Successfully deleted ${ids.length} store items.`);
        await loadItems();
        setRowSelection({});
      } else {
        toast.error("Failed to delete store items in bulk.");
      }
    } catch (e) {
      toast.error("An error occurred during bulk deletion.");
      console.error(e);
    } finally {
      setIsBulkDeleting(false);
      setIsBulkDeleteAlertOpen(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container tap-dark mx-auto px-6 py-8 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl tap-dark">Store Manager</h1>
        <Button onClick={() => {
          setItemToEdit(null);
          setIsSheetOpen(true);

        }} className="bg-[#4D8243] text-white cursor-pointer active:scale-95 hover:bg-[#3d6935]">
          <PlusIcon className="mr-2 h-4 w-4" /> Create Store Item
        </Button>
      </div>


      <div className="flex flex-wrap items-center gap-4 py-4">
        <Input
          placeholder="Filter items by name..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs tap-dark border-black/30 bg-white/50 backdrop-blur-sm focus:bg-white transition-all shadow-sm"
        />

        <Select value={bundleFilter} onValueChange={(val: any) => setBundleFilter(val)}>
          <SelectTrigger className="w-[160px] bg-white/50 backdrop-blur-sm">
            <SelectValue placeholder="Bundle Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bundles</SelectItem>
            <SelectItem value="in-bundle">In a Bundle</SelectItem>
            <SelectItem value="standalone">Standalone</SelectItem>
          </SelectContent>
        </Select>

        <Select value={freeFilter} onValueChange={(val: any) => setFreeFilter(val)}>
          <SelectTrigger className="w-[140px] bg-white/50 backdrop-blur-sm">
            <SelectValue placeholder="Free Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Status</SelectItem>
            <SelectItem value="free">Free Only</SelectItem>
            <SelectItem value="paid">Paid Only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priceFilter} onValueChange={(val: any) => setPriceFilter(val)}>
          <SelectTrigger className="w-[140px] bg-white/50 backdrop-blur-sm">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Price</SelectItem>
            <SelectItem value="zero">Price is £0</SelectItem>
            <SelectItem value="paid">Price {">"} £0</SelectItem>
          </SelectContent>
        </Select>

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
                variant="ghost"
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
                className="flex items-center font-bold shadow-sm"
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="tap-dark ">
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
                  No store items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center  space-x-2 py-4">
        <span className="text-sm text-muted-foreground tap-dark opacity-70">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <Button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="tap-dark"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="tap-dark"

        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-black/5 text-xs tap-dark flex items-start gap-6 flex-col">
        <span className=" text-tap-dark uppercase tracking-tight">Table Legend:</span>
        <div className="flex flex-col items-start gap-2">
          <Badge variant="outline" className="h-5 px-1.5 border-green-600 text-green-700 text-[9px] ">ATB</Badge>
          <span>Access Through Bundle (Only available within a curated collection)</span>
        </div>
        <div className="flex flex-col items-start gap-2">
          <Badge variant="outline" className="h-5 px-1.5 border-blue-600 text-blue-700 text-[9px] ">ABB</Badge>
          <span>Available by Booking (Requires manual consultation or external booking)</span>
        </div>
      </div>


      {/* --- Dialogs & Modals --- */}

      <StoreItemSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        itemToEdit={itemToEdit}
        bundles={bundles}
        onSubmit={handleFormSubmit}
        isPending={isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={() => setItemToDelete(null)}
      >
        <AlertDialogContent className="bg-white border tap-dark border-black/10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600">
              Delete Store Item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
              This will permanently delete{" "}
              <span className="font-semibold text-gray-800">
                "{itemToDelete?.name}"
              </span>{" "}
              from the store. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="border-black/10 hover:bg-gray-50">
              Keep Item
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

      {/* Bulk Delete confirmation */}
      <AlertDialog
        open={isBulkDeleteAlertOpen}
        onOpenChange={setIsBulkDeleteAlertOpen}
      >
        <AlertDialogContent className="bg-white border tap-dark border-black/10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600">
              Bulk Delete Store Items?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
              You are about to delete{" "}
              <span className="font-semibold text-gray-800">
                {table.getFilteredSelectedRowModel().rows.length}
              </span>{" "}
              store items. This action cannot be undone.
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

      {/* Bundle Details Sheet */}
      <Sheet open={!!viewingBundle} onOpenChange={(open) => !open && setViewingBundle(null)}>
        <SheetContent side="responsive-right" className="p-0 border-none shadow-2xl bg-white flex flex-col h-full overflow-hidden">
          {viewingBundle && (
            <div className="flex flex-col h-full bg-gray-50/30">
              <SheetHeader className="p-8 md:p-10 pb-6 bg-white border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Layers className="w-5 h-5 text-green-700" />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest border-green-200 text-green-700">Collection</Badge>
                </div>
                <SheetTitle className="text-3xl font-black text-[#2D4A29] leading-tight">
                  {viewingBundle.name}
                </SheetTitle>
                <SheetDescription className="text-sm font-medium text-gray-500 mt-2 line-clamp-3">
                  {viewingBundle.desc}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 styled-scrollbar">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                  <img
                    src={viewingBundle.imageUrl}
                    alt={viewingBundle.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-[10px] font-black  uppercase tracking-widest block mb-1">Price Point</span>
                    <span className="text-2xl font-black text-[#2D4A29]">
                      {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(viewingBundle.price)}
                    </span>
                  </div>
                  <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-[10px] font-black  uppercase tracking-widest block mb-1">Added On</span>
                    <span className="text-base  text-[#2D4A29]">
                      {new Date(viewingBundle.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black  uppercase tracking-[0.2em]">Included Resources</h4>
                  <div className="space-y-2">
                    {viewingBundle.includes && viewingBundle.includes.length > 0 ? (
                      viewingBundle.includes.map((incl, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100/50 text-sm  text-[#2D4A29]">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {incl}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm italic text-muted-foreground">No specific resources listed.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 border-t border-gray-100">
                <Button
                  onClick={() => setViewingBundle(null)}
                  className="w-full h-14 bg-[#2D4A29] hover:bg-[#5C9952] text-white rounded-xl font-black shadow-lg transition-all active:scale-95"
                >
                  Close Details
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Skeleton component for the loading state, matching the established pattern
function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex items-center py-4">
        <Skeleton className="h-10 w-80" />
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-[500px] w-full" />
      </div>
    </div>
  );
}
