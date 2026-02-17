"use client";

import ListContainer from "../lists/ListContainer";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";

const DonutLegend = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-2">
    {data.map(({ name, value, color }: any) => (
      <div key={name} className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-gray-300">{name}</span>
        </div>
        <span className="text-white font-medium">{value}%</span>
      </div>
    ))}
  </div>
);

const TaskChartIndex = ({ data }: { data: any }) => {
  return (
    <>
      <ListContainer title="Total PRs Created and Reviews Requested">
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={60}
              dataKey="value"
              paddingAngle={4}
            >
              {data.map((e: any, i: any) => (
                <Cell key={i} fill={e.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#000",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <DonutLegend data={data} />
      </ListContainer>
    </>
  );
};

export default TaskChartIndex;
