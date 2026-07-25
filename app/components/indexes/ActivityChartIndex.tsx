"use client";

import ListContainer from "../lists/ListContainer";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Folder } from "lucide-react";
import { IActivityData } from "@/lib/types";

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

const ActivityChartIndex = ({ data }: { data: IActivityData[] }) => {
  return (
    <ListContainer title="Activity by Repository">
      <div className="grid grid-cols-1 gap-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" barSize={10}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="repo"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={180}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
            <Bar
              dataKey="prs"
              name="My PRs"
              fill="#6366f1"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="merged"
              name="Merged PRs"
              fill="#10b981"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="issues"
              name="Issues Assigned"
              fill="#0284c7"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="space-y-3 justify-center flex flex-col pt-2 border-t border-slate-800/60">
          {data.map(({ repo, prs, merged, issues }: IActivityData) => {
            const rate = prs ? Math.round((merged / prs) * 100) : 0;
            return (
              <div key={repo} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-48 shrink-0">
                  <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-300 font-medium truncate">
                    {repo}
                  </span>
                </div>
                <div className="flex-1 bg-slate-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-9 text-right shrink-0 font-medium">
                  {rate}%
                </span>
                <span className="text-xs text-slate-500 w-32 text-right shrink-0">
                  {merged}/{prs} PR · {issues} Issues
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </ListContainer>
  );
};

export default ActivityChartIndex;
