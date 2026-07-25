"use client";

import { mockActivityData } from "@/mocks/data.mock";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ListContainer from "../lists/ListContainer";

interface ChartData {
  date: string;
  prs: number;
  reviews: number;
}

const ChartIndex = ({ data }: { data: ChartData[] }) => {
  return (
    <ListContainer title="Weekly Activity">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
          />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#131924",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            itemStyle={{ color: "#f8fafc" }}
            labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "10px" }} />
          <Line
            type="monotone"
            dataKey="prs"
            stroke="#6366f1"
            strokeWidth={2.5}
            name="My PRs Created"
            dot={{ fill: "#6366f1", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="reviews"
            stroke="#f59e0b"
            strokeWidth={2.5}
            name="Reviews Needed"
            dot={{ fill: "#f59e0b", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ListContainer>
  );
};

export default ChartIndex;
