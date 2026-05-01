"use client";

import { useState, useMemo, useEffect } from "react";
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
  Package,
  Layers,
  CheckCircle2,
  Search,
  X,
  PlusIcon,
} from "lucide-react";
import { StoreItem, Bundle } from "@/app/generated/prisma/browser";
import {
  fetchBundles,
  fetchItems,
  deleteBundle,
} from "@/app/actions/adminOps";
import { BundleSheet } from "./components/BundleSheet";
import { ManageItemsSheet } from "./components/ManageItemsSheet";
import { useBundleMutation } from "./hooks/useBundleMutation";
import { BundleFormData } from "./components/bundleSchema";

// ShadCN UI components
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
  DropdownMenuSeparator,
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
import { toast } from "sonner";

// --- TYPE DEFINITIONS ---
type BundleWithItems = Bundle & { items: StoreItem[] };

// --- MAIN COMPONENT ---
export default function BundleDashboardPage() {
  const { session } = useAuth();
  const [bundles, setBundles] = useState<BundleWithItems[]>([]);
  const [allItems, setAllItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 40 });

  // State for sheet / dialogs
  const [bundleToDelete, setBundleToDelete] = useState<Bundle | null>(null);
  const [bundleToEdit, setBundleToEdit] = useState<BundleWithItems | null>(null);
  const [bundleToManageItems, setBundleToManageItems] = useState<BundleWithItems | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  // Custom Mutation Hook
  const { mutate, isPending } = useBundleMutation(
    bundleToEdit,
    session,
    async () => {
      await loadData();
      setIsSheetOpen(false);
      setBundleToEdit(null);
    }
  );

  const loadData = async () => {
    setLoading(true);
    const [fetchedBundles, fetchedItems] = await Promise.all([
      fetchBundles(),
      fetchItems(),
    ]);
    setBundles(fetchedBundles as BundleWithItems[]);
    setAllItems(fetchedItems || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = (data: BundleFormData) => {
    mutate(data);
  };

  const handleDelete = async () => {
    if (!session || !bundleToDelete) return;
    const success = await deleteBundle(bundleToDelete.id, session);
    if (success) {
      await loadData();
      toast.success("Bundle deleted");
    } else {
      toast.error("Failed to delete bundle");
    }
    setBundleToDelete(null);
  };

  // filteredItems and handleToggleItem removed — now handled in ManageItemsSheet

  const columns = useMemo<ColumnDef<BundleWithItems>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Bundle",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 min-w-[260px]">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-black/5 bg-muted">
              <img
                src={row.original.imageUrl}
                alt={row.original.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm tap-dark truncate">{row.original.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {row.original.category.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "items",
        header: "Items",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs bg-muted/40 border-black/10 tap-dark">
            {row.original.items.length}{" "}
            {row.original.items.length === 1 ? "item" : "items"}
          </Badge>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="font-semibold text-sm tap-dark">
            {new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency: "GBP",
            }).format(row.original.price)}
          </span>
        ),
      },
      {
        accessorKey: "badge",
        header: "Badge",
        cell: ({ row }) =>
          row.original.badge ? (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              {row.original.badge}
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground/40 italic">—</span>
          ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white  border-black/20 shadow-lg">
              <DropdownMenuItem
                className="cursor-pointer tap-dark hover:bg-blue-500/10"
                onClick={() => {
                  setBundleToEdit(row.original);
                  setIsSheetOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Bundle
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-[#5C9952] hover:bg-green-500/20"
                onClick={() => setBundleToManageItems(row.original)}
              >
                <Layers className="mr-2 h-4 w-4 text-[#5C9952]" /> Manage Items
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 hover:bg-red-500/10 cursor-pointer"
                onClick={() => setBundleToDelete(row.original)}
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

  const table = useReactTable({
    data: bundles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: setPagination,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter, pagination },
    onGlobalFilterChange: setGlobalFilter,
  });

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="container mx-auto px-6 py-8 min-h-full tap-dark">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tap-dark">Bundle Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage curated collections of store items.
          </p>
        </div>
        <Button
          onClick={() => {
            setBundleToEdit(null);
            setIsSheetOpen(true);
          }}
          className="bg-[#4D8243] text-white cursor-pointer active:scale-95 hover:bg-[#3d6935]"
        >
          <PlusIcon className="mr-2 h-4 w-4" /> Create Bundle
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bundles…"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 tap-dark border-black/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="tap-dark">
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 opacity-20" />
                    No bundles found.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <span className="text-xs text-muted-foreground tap-dark font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* --- ADD/EDIT SHEET --- */}
      <BundleSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        bundleToEdit={bundleToEdit}
        allItems={allItems}
        onSubmit={onSubmit}
        isPending={isPending}
      />

      {/* --- MANAGE ITEMS SHEET --- */}
      <ManageItemsSheet
        bundle={bundleToManageItems}
        allItems={allItems}
        session={session}
        onClose={() => setBundleToManageItems(null)}
        onSaved={async () => {
          await loadData();
          setBundleToManageItems(null);
        }}
      />

      {/* --- DELETE ALERT --- */}
      <AlertDialog
        open={!!bundleToDelete}
        onOpenChange={(isOpen) => !isOpen && setBundleToDelete(null)}
      >
        <AlertDialogContent className="bg-white border tap-dark border-black/10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600">
              Delete Bundle?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
              This will permanently delete{" "}
              <span className="font-semibold text-gray-800">"{bundleToDelete?.name}"</span>.
              Store items in this bundle will be unassigned but not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="border-black/10 hover:bg-gray-50">Keep Bundle</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Dashboard Skeleton ---
function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex items-center py-4">
        <Skeleton className="h-10 w-80" />
      </div>
      <div className="rounded-md border overflow-hidden">
        <Skeleton className="h-12 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
