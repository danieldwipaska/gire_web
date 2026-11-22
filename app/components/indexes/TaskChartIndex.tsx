"use client";

import ListContainer from "../lists/ListContainer";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";

import { ITaskChartData } from "@/lib/types";

const DonutLegend = ({ data }: { data: ITaskChartData[] }) => (
  <div className="mt-3 space-y-2">
    {data.map(({ name, fraction, color }: ITaskChartData) => (
      <div key={name} className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-[#6E6E77] font-medium">{name}</span>
        </div>
        <span className="text-[#1C1C1F] font-bold tabular-nums">{Math.round((fraction || 0) * 100)} %</span>
      </div>
    ))}
  </div>
);

const TaskChartIndex = ({ data }: { data: ITaskChartData[] }) => {
  return (
    <ListContainer title="My Merged PRs vs PR Reviews Needed">
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={38}
            outerRadius={58}
            dataKey="value"
            paddingAngle={4}
          >
            {data.map((e, i) => (
              <Cell key={i} fill={e.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E2E2",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(28,28,31,0.08)",
              color: "#1C1C1F",
              fontSize: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <DonutLegend data={data} />
    </ListContainer>
  );
};

export default TaskChartIndex;
