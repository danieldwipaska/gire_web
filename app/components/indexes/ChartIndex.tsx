"use client";

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
            stroke="rgba(28,28,31,0.06)"
          />
          <XAxis
            dataKey="date"
            stroke="#8A8A93"
            tick={{ fill: "#6E6E77", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#8A8A93"
            tick={{ fill: "#6E6E77", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E2E2",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(28,28,31,0.08)",
              fontSize: "12px",
            }}
            itemStyle={{ color: "#1C1C1F" }}
            labelStyle={{ color: "#6E6E77", fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#6E6E77", paddingTop: "10px" }} />
          <Line
            type="monotone"
            dataKey="prs"
            stroke="#5432EE"
            strokeWidth={2.5}
            name="My PRs Created"
            dot={{ fill: "#5432EE", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="reviews"
            stroke="#EA5DEE"
            strokeWidth={2.5}
            name="Reviews Needed"
            dot={{ fill: "#EA5DEE", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ListContainer>
  );
};

export default ChartIndex;
