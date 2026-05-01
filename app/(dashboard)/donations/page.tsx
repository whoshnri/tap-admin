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
  Users,
  TrendingUp,
  Award,
} from "lucide-react";
import { Donation } from "@/app/generated/prisma/client";
import { fetchDonations } from "@/app/actions/adminOps"; // Adjust path as needed
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// --- TYPE DEFINITIONS ---
type MonthlyDonation = {
  name: string; // e.g., "Jan '24"
  total: number;
};

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

// --- MAIN COMPONENT ---
export default function DonationsDashboardPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 40 });

  useEffect(() => {
    async function loadDonations() {
      setLoading(true);
      const fetchedDonations = await fetchDonations();
      const maindonations = fetchedDonations?.map((donation) => {
        donation.amount = Number(donation.amount) / 100;
        return donation;
      });
      setDonations(maindonations || []);
      setLoading(false);
    }
    loadDonations();
  }, []);

  // Memoized calculations for stats and chart data
  const { monthlyTotal, averageDonation, highestDonation, chartData } =
    useMemo(() => {
      if (donations.length === 0) {
        return {
          monthlyTotal: 0,
          averageDonation: 0,
          highestDonation: null,
          chartData: [],
        };
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyTotal = donations
        .filter((d) => {
          const donationDate = new Date(d.createdAt);
          return (
            donationDate.getMonth() === currentMonth &&
            donationDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, d) => sum + d.amount, 0);

      const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
      const averageDonation = totalDonations / donations.length;

      const highestDonation = donations.reduce(
        (max, d) => (d.amount > max.amount ? d : max),
        donations[0]
      );

      // Process data for the chart
      const monthlyAggregates: { [key: string]: number } = {};
      donations.forEach((donation) => {
        const date = new Date(donation.createdAt);
        const monthYear = date.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        if (!monthlyAggregates[monthYear]) {
          monthlyAggregates[monthYear] = 0;
        }
        monthlyAggregates[monthYear] += donation.amount;
      });

      const chartData: MonthlyDonation[] = Object.entries(monthlyAggregates)
        .map(([name, total]) => ({ name, total }))
        // Optional: sort by date if needed, requires more complex date parsing
        .slice(-12); // Show last 12 months for clarity

      return { monthlyTotal, averageDonation, highestDonation, chartData };
    }, [donations]);

  const columns = useMemo<ColumnDef<Donation>[]>(
    () => [
      { accessorKey: "donor", header: "Donor Name" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      { accessorKey: "location", header: "Location" },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
    ],
    []
  );

  const table = useReactTable({
    data: donations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: setPagination,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter, pagination },
    onGlobalFilterChange: setGlobalFilter,
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container tap-dark mx-auto p-8 min-h-full ">
      <h1 className="text-3xl font-bold mb-6 tap-dark">Donations Overview</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Donations This Month"
          value={formatCurrency(monthlyTotal)}
          icon={TrendingUp}
        />
        <StatsCard
          title="Average Donation"
          value={formatCurrency(averageDonation)}
          icon={DollarSign}
        />
        <StatsCard
          title="Total Donors"
          value={donations.length.toString()}
          icon={Users}
        />
        <StatsCard
          title="Highest Donation"
          value={formatCurrency(highestDonation?.amount ?? 0)}
          description={`by ${highestDonation?.donor ?? "N/A"}`}
          icon={Award}
        />
      </div>

      {/* Donation Trends Chart */}
      <Card className="mb-8 border-black/30 tap-dark">
        <CardHeader>
          <CardTitle className="tap-dark">Donation Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
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
                cursor={{ fill: "none" }}
                contentStyle={{
                  borderRadius: "8px",
                  color: "#4A7044",
                  border: "1px solid #4A7044",
                }}
                formatter={(value: number) => [
                  formatCurrency(value),
                  "Total",
                ]}
              />
              <Bar dataKey="total" fill="#4A7044" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Donors Table */}
      <h2 className="text-2xl font-bold mb-4 tap-dark">All Donations</h2>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by donor name or email..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm tap-dark border-black/30"
        />
      </div>
      <div className="rounded-md border tap-dark">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="tap-dark font-bold">
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No donations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <span className="text-sm text-muted-foreground tap-dark opacity-70">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---
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
        <div className={`text-4xl font-sans font-bold tap-dark `}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 px-6 font-serif">
      <Skeleton className="h-8 w-80 mb-6" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-[350px] w-full mb-8" />
      <Skeleton className="h-8 w-64 mb-4" />
      <div className="flex items-center py-4">
        <Skeleton className="h-10 w-80" />
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}