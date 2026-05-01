"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface PlatformAnalyticsProps {
  distributionData: { name: string; value: number }[];
  trendData: { name: string; total: number }[];
}

const COLORS = ["#2D4A29", "#5C9952", "#D97941"];

export function PlatformAnalytics({ distributionData }: { distributionData: { name: string; value: number }[] }) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={distributionData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={110}
              paddingAngle={8}
              dataKey="value"
              stroke="none"
            >
              {distributionData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
                contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    padding: '12px 16px'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
            />
            <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
