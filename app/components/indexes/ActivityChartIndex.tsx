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

const ActivityChartIndex = ({ data }: { data: IActivityData[] }) => {
  return (
    <ListContainer title="Activity by Repository">
      <div className="grid grid-cols-1 gap-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" barSize={10}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--ui-chart-grid)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "#6E6E77", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="repo"
              tick={{ fill: "#6E6E77", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={180}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#6E6E77" }} />
            <Bar
              dataKey="prs"
              name="My PRs"
              fill="#5432EE"
              radius={[0, 6, 6, 0]}
            />
            <Bar
              dataKey="merged"
              name="Merged PRs"
              fill="#69D7D8"
              radius={[0, 6, 6, 0]}
            />
            <Bar
              dataKey="issues"
              name="Issues Assigned"
              fill="#418CFF"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="space-y-3 justify-center flex flex-col pt-3 border-t border-[#D4D4D8]">
          {data.map(({ repo, prs, merged, issues }: IActivityData) => {
            const rate = prs ? Math.min(100, Math.round((merged / prs) * 100)) : 0;
            return (
              <div key={repo} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-48 shrink-0">
                  <Folder className="w-3.5 h-3.5 text-[#6E6E77] shrink-0" />
                  <span className="text-xs text-[#1C1C1F] font-semibold truncate">
                    {repo}
                  </span>
                </div>
                <div className="flex-1 bg-[#E2E2E2] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-[#1C1C1F] animate-progress-fill"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-xs text-[#1C1C1F] w-9 text-right shrink-0 font-bold tabular-nums">
                  {rate}%
                </span>
                <span className="text-xs text-[#6E6E77] w-32 text-right shrink-0">
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
