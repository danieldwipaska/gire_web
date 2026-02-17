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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-lg p-3 text-sm">
      <p className="text-gray-300 font-medium mb-1">{label}</p>
      {payload.map((p: any, i: any) => (
        <p key={i} style={{ color: p.color }} className="capitalize">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const CodeChurnChartIndex = ({ data }: { data: any }) => {
  return (
    <>
      <ListContainer title="Code Churn per Day">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barSize={14}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="day"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />
            <Bar
              dataKey="additions"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              name="Additions"
            />
            <Bar
              dataKey="deletions"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              name="Deletions"
            />
            <Bar
              dataKey="changedFiles"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Changed Files"
            />
          </BarChart>
        </ResponsiveContainer>
      </ListContainer>
    </>
  );
};

export default CodeChurnChartIndex;
