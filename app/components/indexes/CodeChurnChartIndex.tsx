"use client";

import ListContainer from "../lists/ListContainer";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ICodeChurnData } from "@/lib/types";

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
    <div className="bg-[#FFFFFF] border border-[#E2E2E2] rounded-xl p-3 text-xs shadow-[0_10px_25px_rgba(28,28,31,0.08)]">
      <p className="text-[#1C1C1F] font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="capitalize font-medium">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const CodeChurnChartIndex = ({ data }: { data: ICodeChurnData[] }) => {
  return (
    <ListContainer title="Code Churn per Day">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={12}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(28,28,31,0.06)"
          />
          <XAxis
            dataKey="day"
            tick={{ fill: "#6E6E77", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6E6E77", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#6E6E77" }} />
          <Bar
            dataKey="additions"
            fill="#69D7D8"
            radius={[6, 6, 0, 0]}
            name="Additions"
          />
          <Bar
            dataKey="deletions"
            fill="#EA5DEE"
            radius={[6, 6, 0, 0]}
            name="Deletions"
          />
          <Bar
            dataKey="changedFiles"
            fill="#5432EE"
            radius={[6, 6, 0, 0]}
            name="Changed Files"
          />
        </BarChart>
      </ResponsiveContainer>
    </ListContainer>
  );
};

export default CodeChurnChartIndex;
