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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#131924] border border-slate-800 rounded-lg p-3 text-xs">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: any) => (
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
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey="day"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
          <Bar
            dataKey="additions"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            name="Additions"
          />
          <Bar
            dataKey="deletions"
            fill="#f43f5e"
            radius={[4, 4, 0, 0]}
            name="Deletions"
          />
          <Bar
            dataKey="changedFiles"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            name="Changed Files"
          />
        </BarChart>
      </ResponsiveContainer>
    </ListContainer>
  );
};

export default CodeChurnChartIndex;
