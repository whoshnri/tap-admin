"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
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
  ShieldCheck,
  KeyRound,
  Search,
} from "lucide-react";
import { Admins, Roles } from "@/app/generated/prisma/browser";
import {
  fetchAdmins,
  addAdmin,
  updateAdminRole,
  deleteAdmin,
  updateAdminPasswordByMasterKey,
} from "@/app/actions/adminOps";
import { AdminSheet } from "./components/AdminSheet";
import { AddAdminFormData, EditRoleFormData, ResetPasswordFormData } from "./components/adminSchema";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

type AdminSheetMode = "add" | "edit-role" | "reset-password";

export default function AdminsDashboardPage() {
  const { session } = useAuth();
  const [admins, setAdmins] = useState<Admins[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 40 });

  const [sheetMode, setSheetMode] = useState<AdminSheetMode | null>(null);
  const [activeAdmin, setActiveAdmin] = useState<Admins | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<Admins | null>(null);
  const [deleteMasterKey, setDeleteMasterKey] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadAdmins = async () => {
    const fetched = await fetchAdmins();
    setAdmins(fetched || []);
  };

  useEffect(() => {
    setLoading(true);
    loadAdmins().finally(() => setLoading(false));
  }, []);

  const openSheet = (mode: AdminSheetMode, admin?: Admins) => {
    setActiveAdmin(admin ?? null);
    setSheetMode(mode);
  };

  const closeSheet = () => {
    setSheetMode(null);
    setActiveAdmin(null);
  };

  const handleAdd = (data: AddAdminFormData) => {
    if (session?.role !== Roles.Owner) {
      toast.error("Only Owner admins can add administrators.");
      return;
    }
    startTransition(async () => {
      const success = await addAdmin(data.name, data.email, data.password, data.master_key, data.role, session);
      if (success) {
        toast.success(`Admin ${data.name} created successfully`);
        await loadAdmins();
        closeSheet();
      } else {
        toast.error("Failed to add admin — check master key.");
      }
    });
  };

  const handleEditRole = (data: EditRoleFormData) => {
    if (session?.role !== Roles.Owner) {
      toast.error("Only Owner admins can change roles.");
      return;
    }
    if (!activeAdmin) return;
    startTransition(async () => {
      const success = await updateAdminRole(activeAdmin.id, data.role, session);
      if (success) {
        toast.success(`Role updated to ${data.role}`);
        await loadAdmins();
        closeSheet();
      } else {
        toast.error("Failed to update role.");
      }
    });
  };

  const handleResetPassword = (data: ResetPasswordFormData) => {
    if (session?.role !== Roles.Root) {
      toast.error("Only Root admins can reset passwords.");
      return;
    }
    if (!activeAdmin) return;
    startTransition(async () => {
      const success = await updateAdminPasswordByMasterKey(
        activeAdmin.email,
        data.newPassword,
        data.master_key,
        session
      );
      if (success) {
        toast.success(`Password reset for ${activeAdmin.name}`);
        closeSheet();
      } else {
        toast.error("Failed — master key may be incorrect.");
      }
    });
  };

  const handleDelete = async () => {
    if (session?.role !== Roles.Owner) {
      toast.error("Only Owner admins can delete administrators.");
      return;
    }
    if (!adminToDelete) return;
    const success = await deleteAdmin(adminToDelete.id, session);
    if (success) {
      toast.success(`${adminToDelete.name} removed`);
      await loadAdmins();
    } else {
      toast.error("Deletion failed — master key may be incorrect.");
    }
    setAdminToDelete(null);
    setDeleteMasterKey("");
  };

  const columns = useMemo<ColumnDef<Admins>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <span className="font-semibold text-sm tap-dark">{row.original.name}</span>,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.email}</span>,
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const role = row.original.role;
          const cls =
            role === Roles.Root
              ? "bg-red-500/10 text-red-600 border-red-200"
              : role === Roles.Owner
                ? "bg-purple-500/10 text-purple-600 border-purple-200"
                : role === Roles.Developer
                  ? "bg-blue-500/10 text-blue-600 border-blue-200"
                  : "bg-gray-100 text-gray-600 border-gray-200";
          return (
            <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${cls}`}>
              <ShieldCheck className="mr-1 h-3 w-3" />
              {role}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Date Added",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString("en-GB")}
          </span>
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
            <DropdownMenuContent align="end" className="bg-white border-black/20 shadow-lg">
              <DropdownMenuItem
                className="cursor-pointer tap-dark hover:bg-blue-500/10"
                onClick={() => openSheet("edit-role", row.original)}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Role
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-[#5C9952] hover:bg-green-500/20"
                onClick={() => openSheet("reset-password", row.original)}
              >
                <KeyRound className="mr-2 h-4 w-4 text-[#5C9952]" /> Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 hover:bg-red-500/10 cursor-pointer"
                onClick={() => setAdminToDelete(row.original)}
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
    data: admins,
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
    <div className="container tap-dark mx-auto py-8 px-6 min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-start md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tap-dark">Admin Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage administrator accounts and permissions.</p>
        </div>
        <Button
          onClick={() => openSheet("add")}
          className="bg-[#4D8243] text-white cursor-pointer active:scale-95 hover:bg-[#3d6935]"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Admin
        </Button>
      </div>

      {session?.role !== Roles.Owner && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-r-xl">
          <p className="font-semibold text-sm">Limited Access</p>
          <p className="text-xs mt-0.5">Only Owner admins can add, edit, or delete administrators.</p>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 tap-dark border-black/20"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="tap-dark font-bold">
                    {flexRender(h.column.columnDef.header, h.getContext())}
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
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No administrators found.
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
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-8 w-8 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Admin Sheet — handles add, edit-role, reset-password */}
      <AdminSheet
        mode={sheetMode}
        admin={activeAdmin}
        isPending={isPending}
        onClose={closeSheet}
        onAddSubmit={handleAdd}
        onEditRoleSubmit={handleEditRole}
        onResetPasswordSubmit={handleResetPassword}
      />

      {/* Delete Alert */}
      <AlertDialog open={!!adminToDelete} onOpenChange={(o) => !o && setAdminToDelete(null)}>
        <AlertDialogContent className="bg-white tap-dark border border-black/10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600">Delete Admin?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
              This will permanently remove{" "}
              <span className="font-semibold text-gray-800">"{adminToDelete?.name}"</span>.
              Enter the master key to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="password"
            autoComplete="off"
            placeholder="Master key"
            value={deleteMasterKey}
            onChange={(e) => setDeleteMasterKey(e.target.value)}
            className="border-black/10 h-12 rounded-xl bg-gray-50"
          />
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="border-black/10 hover:bg-gray-50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!deleteMasterKey}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Delete Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex items-center py-4">
        <Skeleton className="h-10 w-80" />
      </div>
      <div className="rounded-md border overflow-hidden">
        <Skeleton className="h-12 w-full" />
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      </div>
    </div>
  );
}
