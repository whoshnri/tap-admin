"use client";

import { useState, useMemo, useEffect } from "react";
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
    Eye,
    FileText,
} from "lucide-react";
import { fetchFormDropForms } from "@/app/actions/formdropOps";
import Link from "next/link";

// Import ShadCN UI components
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// --- TYPE DEFINITIONS ---
export type FormDropForm = {
    id: string;
    name: string;
    createdAt: string;
    submissionsCount?: number;
};

// --- MAIN COMPONENT ---
export default function FormDropDashboardPage() {
    const [forms, setForms] = useState<FormDropForm[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 40 });

    useEffect(() => {
        async function loadForms() {
            setLoading(true);
            const fetchedForms = await fetchFormDropForms();
            setForms(fetchedForms);
            setLoading(false);
        }
        loadForms();
    }, []);

    const columns = useMemo<ColumnDef<FormDropForm>[]>(
        () => [
            {
                accessorKey: "id",
                header: "Form ID",
                cell: ({ row }) => (
                    <div className="font-mono text-xs">
                        {row.original.id}
                    </div>
                ),
            },
            {
                accessorKey: "name",
                header: "Name",
                cell: ({ row }) => (
                    <div className="font-medium">{row.original.name || "Untitled Form"}</div>
                ),
            },
            {
                accessorKey: "createdAt",
                header: "Created At",
                cell: ({ row }) =>
                    new Date(row.original.createdAt).toLocaleDateString(),
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <Button asChild variant="ghost" size="sm" className="gap-2">
                        <a href={`/formdrop/${row.original.id}`}>
                            <Eye className="h-4 w-4" />
                            View Submissions
                        </a>
                    </Button>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: forms,
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
        <div className="container mx-auto py-8 min-h-full px-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tap-dark">FormDrop Forms</h1>
                    <p className="text-muted-foreground tap-dark opacity-70">
                        Manage and view submissions from your FormDrop forms.
                    </p>
                </div>
            </div>

            <Card className="border-black/30 tap-dark mb-8">
                <CardHeader>
                    <CardTitle className="tap-dark flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        All Forms
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <Input
                            placeholder="Filter forms..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="max-w-sm tap-dark border-black/30"
                        />
                    </div>

                    <div className="rounded-md border border-black/30">
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
                                            No forms found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="border-black/30 tap-dark"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="border-black/30 tap-dark"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="container mx-auto py-8 px-6 min-h-full">
            <Skeleton className="h-8 w-80 mb-6" />
            <Card className="border-black/30 tap-dark">
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <Skeleton className="h-10 w-80" />
                    </div>
                    <div className="rounded-md border">
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
