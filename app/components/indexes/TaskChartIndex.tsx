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
          <span className="text-slate-300 font-medium">{name}</span>
        </div>
        <span className="text-slate-100 font-bold">{Math.round((fraction || 0) * 100)} %</span>
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
            {data.map((e: any, i: any) => (
              <Cell key={i} fill={e.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#131924",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#f8fafc",
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
