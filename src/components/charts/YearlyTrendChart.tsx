"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { YearCount } from "@/lib/aggregate";

const BLUE = "#0070d1";
const INK_MUTE = "#6b6b6b";
const GRID = "#f3f3f3";

export default function YearlyTrendChart({
  data,
  onBarClick,
}: {
  data: YearCount[];
  onBarClick?: (year: number) => void;
}) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-mute">표시할 연도별 데이터가 없습니다.</p>;
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={{ stroke: GRID }}
            tick={{ fill: INK_MUTE, fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: INK_MUTE, fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,112,209,0.06)" }}
            formatter={(value) => [`${value}건`, "인정 건수"]}
            labelFormatter={(label) => `${label}년`}
            contentStyle={{ borderRadius: 8, border: "1px solid #f3f3f3", fontSize: 13 }}
          />
          <Bar
            dataKey="count"
            fill={BLUE}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            cursor={onBarClick ? "pointer" : undefined}
            onClick={(entry: { payload?: YearCount }) => {
              const year = entry?.payload?.year;
              if (year !== undefined) onBarClick?.(year);
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
