"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface BlogViewData {
  title: string;
  views: number;
}

export function BlogViewsChart({ data }: { data: BlogViewData[] }) {
  // Sort and take top 5 if not already done, but the parent does it
  const chartData = data.map(item => ({
    name: item.title,
    views: item.views,
  }));

  const COLORS = ["#4A7044", "#5C9952", "#7CB342", "#9CCC65", "#C5E1A5"];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
      >
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          width={180}
          tick={{ fontSize: 11, fill: "#666" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          formatter={(value: number) => [value.toLocaleString(), "Views"]}
        />
        <Bar
          dataKey="views"
          radius={[0, 4, 4, 0]}
          barSize={20}
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
