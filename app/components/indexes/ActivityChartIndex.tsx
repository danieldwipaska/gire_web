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
import { Target } from "lucide-react";

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

const ActivityChartIndex = ({ data }: { data: any }) => {
  return (
    <>
      <ListContainer title="Activity by Repository">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical" barSize={12}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="repo"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={62}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />
              <Bar
                dataKey="prs"
                name="Total PRs"
                fill="#a855f7"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="merged"
                name="Merged"
                fill="#22c55e"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="issues"
                name="Issues"
                fill="#f59e0b"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-3 justify-center flex flex-col">
            {data.map(({ repo, prs, merged, issues }: any) => {
              const rate = Math.round((merged / prs) * 100);
              return (
                <div key={repo} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24 shrink-0">
                    <Target className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-300 truncate">
                      {repo}
                    </span>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-linear-to-r from-purple-500 to-pink-500"
                      style={{ width: `${rate || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-9 text-right shrink-0">
                    {rate || 0}%
                  </span>
                  <span className="text-xs text-gray-500 w-20 text-right shrink-0">
                    {merged}/{prs} PR · {issues} Issues
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </ListContainer>
    </>
  );
};

export default ActivityChartIndex;
