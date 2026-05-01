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
    ArrowLeft,
    Download,
} from "lucide-react";
import { fetchFormDropSubmissions } from "@/app/actions/formdropOps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useParams, useRouter } from "next/navigation";

// --- MAIN COMPONENT ---
export default function FormSubmissionsPage() {
    const router = useRouter();
    const params = useParams<{ formId: string }>();
    const formId = params.formId;
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 40 });

    useEffect(() => {
        async function loadSubmissions() {
            setLoading(true);
            const fetchedSubmissions = await fetchFormDropSubmissions(formId);
            setSubmissions(fetchedSubmissions);
            setLoading(false);
        }
        loadSubmissions();
    }, [formId]);

    // Dynamically generate columns based on the keys available in submissions
    const columns = useMemo<ColumnDef<any>[]>(() => {
        if (submissions.length === 0) return [];

        // Get all unique keys from all submissions to ensure no data is missed
        const allKeys = new Set<string>();
        submissions.forEach(sub => {
            Object.keys(sub.data || {}).forEach(key => allKeys.add(key));
        });

        const cols: ColumnDef<any>[] = [
            {
                accessorKey: "submittedAt",
                header: "Date",
                cell: ({ row }) => new Date(row.original.submittedAt || Date.now()).toLocaleString(),
            },
        ];

        allKeys.forEach((key) => {
            cols.push({
                accessorKey: `data.${key}`,
                header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                cell: ({ row }) => {
                    const val = row.original.data?.[key];
                    if (typeof val === 'object' && val !== null) {
                        return JSON.stringify(val);
                    }
                    return val?.toString() || "-";
                }
            });
        });

        return cols;
    }, [submissions]);

    const table = useReactTable({
        data: submissions,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onPaginationChange: setPagination,
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: { globalFilter, pagination },
        onGlobalFilterChange: setGlobalFilter,
    });

    const exportToCSV = () => {
        if (submissions.length === 0) return;

        const headers = columns.map(c => (c as any).header as string);
        const rows = submissions.map(sub => {
            return columns.map(col => {
                const accessor = (col as any).accessorKey;
                if (accessor === 'submittedAt') return new Date(sub.submittedAt).toISOString();
                const key = accessor.replace('data.', '');
                return sub.data?.[key] || "";
            });
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `submissions-${formId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="container mx-auto py-8 min-h-full px-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push("/formdrop")} className="p-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tap-dark">Submissions</h1>
                        <p className="text-muted-foreground tap-dark opacity-70">
                            Form ID: {formId}
                        </p>
                    </div>
                </div>
                <Button onClick={exportToCSV} className="gap-2 bg-green-700 hover:bg-green-800 text-white">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <Card className="border-black/30 tap-dark mb-8">
                <CardHeader>
                    <CardTitle className="tap-dark">Submission History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <Input
                            placeholder="Filter submissions..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="max-w-sm tap-dark border-black/30"
                        />
                    </div>

                    <div className="rounded-md border border-black/30 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((hg) => (
                                    <TableRow key={hg.id}>
                                        {hg.headers.map((h) => (
                                            <TableHead key={h.id} className="tap-dark font-bold whitespace-nowrap">
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
                                                <TableCell key={cell.id} className="tap-dark whitespace-nowrap">
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
                                            No submissions found.
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
