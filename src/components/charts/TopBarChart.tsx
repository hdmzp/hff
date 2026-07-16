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
import type { NamedCount } from "@/lib/aggregate";

const BLUE = "#0070d1";
const INK_MUTE = "#6b6b6b";
const GRID = "#f3f3f3";

/** 가로 막대 랭킹 차트 (기능성 TOP10, 업체 TOP10, 지역 분포 공용) */
export default function TopBarChart({
  data,
  unit = "건",
  height = 320,
  onBarClick,
}: {
  data: NamedCount[];
  unit?: string;
  height?: number;
  onBarClick?: (name: string) => void;
}) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-mute">표시할 데이터가 없습니다.</p>;
  }
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 8 }}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            tick={{ fill: INK_MUTE, fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#000000", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,112,209,0.06)" }}
            formatter={(value) => [`${value}${unit}`, "건수"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #f3f3f3", fontSize: 13 }}
          />
          <Bar
            dataKey="count"
            fill={BLUE}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            label={{ position: "right", fill: INK_MUTE, fontSize: 12 }}
            cursor={onBarClick ? "pointer" : undefined}
            onClick={(entry: { payload?: NamedCount }) => {
              const name = entry?.payload?.name;
              if (name) onBarClick?.(name);
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
