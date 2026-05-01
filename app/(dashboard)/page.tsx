import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/authOps";
import { fetchDashNotifications, fetchOrders } from "@/app/actions/adminOps";
import { fetchDonations, fetchItems, fetchBlogs } from "@/app/actions/adminOps";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  ShoppingBag,
  Eye,
  HeartHandshake,
  Newspaper,
  Package,
} from "lucide-react";
import { PlatformAnalytics } from "./components/PlatformAnalytics";
import { BlogViewsChart } from "./components/BlogViewsChart";
import type { Notification } from "@/app/generated/prisma/client";
import { RecentActivities } from "./components/RecentActivities";

type TopListItem = {
  name: string; 
  count: number; 
  imageUrl: string;
};

type BlogListItem = {
    title: string;
    views: number;
}


export default async function DashboardHomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // 1. Fetch all data and immediately guarantee they are arrays
  const [fetchedOrders, fetchedDonations, fetchedItems, fetchedBlogs, fetchedDashNotifications] =
    await Promise.all([
      fetchOrders(),
      fetchDonations(),
      fetchItems(),
      fetchBlogs(),
      fetchDashNotifications(0, 100),
    ]);

  const orders = fetchedOrders || [];
  const donations = fetchedDonations?.map((donation) => {
    donation.amount = Number(donation.amount) / 100;
    return donation;
  }) || [];
  const items = fetchedItems || [];
  const blogs = fetchedBlogs || [];

  // 2. Perform all analytics calculations with safe, non-nullable data
  const now = new Date();
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
  const newOrdersThisMonth = orders.filter(
    (o) =>
      new Date(o.createdAt).getMonth() === now.getMonth() &&
      new Date(o.createdAt).getFullYear() === now.getFullYear()
  ).length;
  const totalBlogViews = blogs.reduce((sum, blog) => sum + blog.views, 0);

  // Chart Data Processing
  const monthlyAggregates = (
    data: any[],
    valueField: string
  ) => {
    const aggregates: { [key: string]: number } = {};

    data.forEach((item) => {
      const date = new Date(item.createdAt);
      const monthYear = date.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });

      aggregates[monthYear] = (aggregates[monthYear] || 0) + (item as any)[valueField];
    });

    return Object.entries(aggregates)
      .map(([name, total]) => ({ name, total }))
      .slice(-12);
  };
  const orderChartData = monthlyAggregates(orders, "total");
  const donationChartData = monthlyAggregates(donations, "amount");

  let totalItemRevenue = 0;
  let totalBundleRevenue = 0;
  orders.forEach(order => {
    order.items.forEach(oi => {
      if (oi.itemId && oi.item) totalItemRevenue += (oi.item.price * oi.quantity);
      if (oi.bundleId && oi.bundle) totalBundleRevenue += (oi.bundle.price * oi.quantity);
    });
  });

  const revenueDistribution = [
    { name: "Items", value: totalItemRevenue },
    { name: "Bundles", value: totalBundleRevenue },
    { name: "Donations", value: totalDonations },
  ].filter(d => d.value > 0);

  // Recent Activity Feed Processing
  const recentActivities: Notification[] = fetchedDashNotifications

  // Top Lists Processing
  const topSellersAggregated: {
    [key: string]: { name: string; count: number; imageUrl: string };
  } = {};

  orders.forEach((order) => {
    order.items.forEach((orderItem) => {
      // Handle individual items
      if (orderItem.itemId && orderItem.item) {
        const key = `item-${orderItem.itemId}`;
        if (!topSellersAggregated[key]) {
          topSellersAggregated[key] = {
            name: orderItem.item.name,
            count: 0,
            imageUrl: orderItem.item.imageUrl,
          };
        }
        topSellersAggregated[key].count += orderItem.quantity;
      }
      // Handle bundles
      if (orderItem.bundleId && orderItem.bundle) {
        const key = `bundle-${orderItem.bundleId}`;
        if (!topSellersAggregated[key]) {
          topSellersAggregated[key] = {
            name: orderItem.bundle.name,
            count: 0,
            imageUrl: orderItem.bundle.imageUrl,
          };
        }
        topSellersAggregated[key].count += orderItem.quantity;
      }
    });
  });

  const topSellingItems: TopListItem[] = Object.values(topSellersAggregated)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topViewedBlogs: BlogListItem[] = blogs
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(b => ({ title: b.title, views: b.views }));

  return (
    <div className="flex-1 space-y-6 py-8 px-6 pt-6 min-h-full">

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
        />
        <StatsCard
          title="Total Donations"
          value={formatCurrency(totalDonations)}
          icon={HeartHandshake}
        />
        <StatsCard
          title="New Orders (This Month)"
          value={`+${newOrdersThisMonth}`}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Total Blog Views"
          value={totalBlogViews.toLocaleString()}
          icon={Eye}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-black/30 tap-dark">
          <CardHeader>
            <CardTitle className="tap-dark">Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <PlatformAnalytics
              distributionData={revenueDistribution}
            />
          </CardContent>
        </Card>
        <Card className="md:col-span-3 col-span-4 border-black/30 tap-dark">
          <CardHeader>
            <CardTitle className="tap-dark">Recent Activity</CardTitle>
            <CardDescription className="tap-dark opacity-70">The latest orders and donations.</CardDescription>
          </CardHeader>
          <RecentActivities recentActivities={recentActivities} />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TopListCard
          title="Top Selling Items"
          data={topSellingItems}
          icon={Package}
        />
        <Card className="border-black/30 tap-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tap-dark">
              <Newspaper className="h-5 w-5" />
              Most Viewed Blogs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pr-4">
            <BlogViewsChart data={topViewedBlogs} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="border-black/30 tap-dark">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium tap-dark">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tap-dark">{value}</div>
      </CardContent>
    </Card>
  );
}

function TopListCard({
  title,
  data,
  icon: Icon,
}: {
  title: string;
  data: TopListItem[];
  icon: React.ElementType;
}) {
  return (
    <Card className="border-black/30 tap-dark">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 tap-dark">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-w-[90vw]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="tap-dark font-bold">Item</TableHead>
              <TableHead className="text-right tap-dark font-bold">
                Units Sold
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index} className="hover:bg-muted/50">
                <TableCell className="font-medium flex items-center gap-4 tap-dark">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded-md"
                    />
                  )}
                  <span className="truncate w-40 md:w-auto tap-dark">{item.name}</span>
                </TableCell>
                <TableCell className="text-right tap-dark font-mono font-bold">
                  {item.count.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function formatCurrency(amount: number) {
  return "$" + amount.toFixed(2);

}
