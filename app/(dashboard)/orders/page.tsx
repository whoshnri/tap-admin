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
  DollarSign,
  TrendingUp,
  Award,
  Package,
  ShoppingBag,
} from "lucide-react";
import { Orders, OrderItem, StoreItem, Bundle } from "@/app/generated/prisma/client";
import { fetchOrders } from "@/app/actions/adminOps";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

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
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";

// --- TYPE DEFINITIONS ---
export type OrderWithItems = Orders & {
  items: (OrderItem & { item: StoreItem | null; bundle: Bundle | null })[];
};

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount
  );

// --- MAIN COMPONENT ---
export default function OrdersDashboardPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 40 });
  const [selectedOrderItems, setSelectedOrderItems] = useState<
    OrderWithItems["items"]
  >([]);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const fetchedOrders = await fetchOrders();

      setOrders(fetchedOrders as OrderWithItems[]);
      setLoading(false);
    }
    loadOrders();
  }, []);

  // Memoized analytics calculations
  const {
    highestOrder,
    mostOrderedItem,
    totalRevenue,
    beneficiaries,
    chartData,
  } = useMemo(() => {
    if (orders.length === 0)
      return {
        highestOrder: null,
        mostOrderedItem: null,
        totalRevenue: 0,
        beneficiaries: [],
        chartData: [],
      };

    const highestOrder = orders.reduce(
      (max, o) => (o.total > max.total ? o : max),
      orders[0]
    );
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const beneficiaries = [
      ...new Set(orders.map((o) => o.orderTo).filter(Boolean) as string[]),
    ];

    const itemCounts: { [key: string]: { name: string; count: number } } = {};
    orders.forEach((order) => {
      order.items.forEach((orderItem) => {
        const key = orderItem.bundleId 
          ? `bundle-${orderItem.bundleId}` 
          : (orderItem.itemId?.toString() || "unknown");
        
        const name = orderItem.item?.name || orderItem.bundle?.name;
        
        if (name) {
          if (!itemCounts[key])
            itemCounts[key] = { name, count: 0 };
          itemCounts[key].count += orderItem.quantity;
        }
      });
    });

    const mostOrderedItem = Object.values(itemCounts).reduce(
      (max, item) => (item.count > max.count ? item : max),
      { name: "N/A", count: 0 }
    );

    const monthlyAggregates: { [key: string]: number } = {};
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const monthYear = date.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      monthlyAggregates[monthYear] =
        (monthlyAggregates[monthYear] || 0) + order.total;
    });

    const chartData = Object.entries(monthlyAggregates)
      .map(([name, total]) => ({ name, total }))
      .slice(-12);

    return {
      highestOrder,
      mostOrderedItem,
      totalRevenue,
      beneficiaries,
      chartData,
    };
  }, [orders]);

  const columns = useMemo<ColumnDef<OrderWithItems>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Order ID",
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            #{row.original.id.substring(0, 8)}...
          </div>
        ),
      },
      { accessorKey: "orderBy", header: "Customer" },
      {
        accessorKey: "items",
        header: "Items",
        cell: ({ row }) => (
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 rounded-lg cursor-pointer border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 font-bold transition-all shadow-sm flex items-center gap-2"
              onClick={() => setSelectedOrderItems(row.original.items)}
            >
              <Package className="w-4 h-4" />
              View Items ({row.original.items.length})
            </Button>
          </SheetTrigger>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.total),
      },
      {
        accessorKey: "complete",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={row.original.complete ? "bg-green-700 text-white" : "bg-yellow-700"}>
            {row.original.complete ? "Completed" : "Pending"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
    ],
    []
  );

  const table = useReactTable({
    data: orders,
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
      <h1 className="text-3xl font-bold mb-6 tap-dark">Orders Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
        />
        <StatsCard
          title="Highest Single Order"
          value={formatCurrency(highestOrder?.total ?? 0)}
          description={`by ${highestOrder?.orderBy ?? "N/A"}`}
          icon={Award}
        />
        <StatsCard
          title="Most Ordered Item"
          value={mostOrderedItem?.name ?? "N/A"}
          description={`${mostOrderedItem?.count ?? 0} units sold`}
          icon={Package}
        />
        <StatsCard
          title="Total Orders"
          value={orders.length.toString()}
          icon={ShoppingBag}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-3 border-black/30 tap-dark">
          <CardHeader>
            <CardTitle className="tap-dark">Order Trends (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {/* --- CORRECTED CHART --- */}
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #4A7044",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="#4A7044"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* <Card>
          <CardHeader>
            <CardTitle className="tap-dark">Beneficiaries</CardTitle>
            <CardDescription className="tap-dark opacity-70">Unique recipients of orders.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {beneficiaries.length > 0 ? (
              <ul className="space-y-2">
                {beneficiaries.map((b) => (
                  <li key={b} className="text-sm p-2 bg-muted rounded-md tap-dark">
                    {b}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No beneficiaries found.
              </p>
            )}
          </CardContent>
        </Card> */}
      </div>

      <h2 className="text-2xl font-bold mb-4 tap-dark">All Orders</h2>
      <Input
        placeholder="Filter by customer..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm mb-4 tap-dark border-black/30"
      />

      <Sheet onOpenChange={(isOpen) => !isOpen && setSelectedOrderItems([])}>
        <div className="rounded-md border">
          {/* --- CORRECTED MAIN TABLE --- */}
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
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <SheetContent 
          side="responsive-right" 
          className="p-0 border-none shadow-2xl bg-white flex flex-col h-full overflow-hidden"
        >
          <div className="flex flex-col h-full bg-gray-50/30">
            <SheetHeader className="p-8 md:p-10 pb-6 bg-white border-b border-gray-100">
              <SheetTitle className="text-3xl font-black text-[#2D4A29]">Order Details</SheetTitle>
              <SheetDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                Breakdown of {selectedOrderItems.length} items in this transaction
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 styled-scrollbar">
              {selectedOrderItems.map((oi) => (
                <div 
                  key={oi.id} 
                  className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-green-200 transition-all"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                    {oi.item?.imageUrl || oi.bundle?.imageUrl ? (
                      <img 
                        src={oi.item?.imageUrl || oi.bundle?.imageUrl} 
                        alt={oi.item?.name || oi.bundle?.name} 
                        className="object-cover w-full h-full" 
                      />
                    ) : (
                      <Package className="w-8 h-8 text-gray-200" />
                    )}
                  </div>
                  
                  <div className="flex-grow flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col min-w-0">
                        <h4 className="font-bold text-[#2D4A29] text-base leading-tight truncate">
                          {oi.item?.name || oi.bundle?.name || "Unknown Item"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {oi.bundle ? "Bundle Content" : (oi.item?.category || "Store Item")}
                          </span>
                          {oi.bundle && (
                            <Badge className="bg-green-100 text-green-800 text-[9px] font-black uppercase tracking-tight hover:bg-green-100 border-none px-2 h-4">
                              Bundle
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-gray-400">Qty:</span>
                         <span className="font-black text-sm text-[#2D4A29]">{oi.quantity}</span>
                      </div>
                      <span className="font-black text-base text-[#2D4A29]">
                        {oi.item 
                          ? formatCurrency(oi.item.price) 
                          : oi.bundle 
                            ? formatCurrency(oi.bundle.price) 
                            : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-8 md:p-10 border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Total</span>
                  <span className="text-3xl font-black text-[#2D4A29]">
                    {formatCurrency(selectedOrderItems.reduce((acc, curr) => 
                       acc + ((curr.item?.price || curr.bundle?.price || 0) * curr.quantity), 0
                    ))}
                  </span>
                </div>
                <Button 
                  className="bg-[#2D4A29] hover:bg-[#5C9952] text-white rounded-xl h-14 px-8 font-black transition-all shadow-lg active:scale-95"
                  variant="default"
                  onClick={() => {/* Potential fulfill action? */}}
                >
                  Close View
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* --- CORRECTED PAGINATION --- */}
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
    </div>
  );
}

// --- SUB-COMPONENTS (StatsCard, Skeleton) remain unchanged ---
interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
}
function StatsCard({ title, value, description, icon: Icon }: StatsCardProps) {
  return (
    <Card className="border-black/30 tap-dark">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium tap-dark">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`font-sans font-bold tap-dark ${title == "Most Ordered Item" ? "text-xl" : "text-4xl "}`}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 px-6 min-h-full">
      <Skeleton className="h-8 w-80 mb-6" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3 mb-8">
        <Skeleton className="h-[350px] lg:col-span-2" />
        <Skeleton className="h-[350px]" />
      </div>
      <Skeleton className="h-8 w-64 mb-4" />
      <div className="rounded-md border">
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}
