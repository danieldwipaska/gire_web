"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ListContainer from "../lists/ListContainer";

import { IMergedPRData } from "@/lib/types";

interface TooltipItem {
  name?: string;
  value?: number;
  color?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#F9F9F9] border border-[#D4D4D8] rounded-xl p-3 text-xs shadow-[0_10px_25px_rgba(28,28,31,0.08)]">
      <p className="text-[#1C1C1F] font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="capitalize font-medium">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const MergedPRChartIndex = ({ data }: { data: IMergedPRData[] }) => {
  return (
    <ListContainer title="My Merged PR Timeline">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={24}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--ui-chart-grid)"
          />
          <XAxis
            dataKey="week"
            tick={{ fill: "#6E6E77", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6E6E77", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="merged"
            name="Merged PRs"
            fill="#418CFF"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ListContainer>
  );
};

export default MergedPRChartIndex;
