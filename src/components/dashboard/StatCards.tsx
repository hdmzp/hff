import type { StatCards as Stats } from "@/lib/aggregate";

export default function StatCards({ stats }: { stats: Stats }) {
  const items = [
    { label: "인정 기능성 원료", value: stats.totalIngredients, unit: "건" },
    { label: "등록 품목", value: stats.totalProducts, unit: "건" },
    { label: "참여 업체", value: stats.totalCompanies, unit: "곳" },
    {
      label: stats.latestYear ? `${stats.latestYear}년 신규 인정` : "최근 신규 인정",
      value: stats.newThisYear,
      unit: "건",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-surface-dark-card p-6">
          <p className="text-sm text-mute-dark">{item.label}</p>
          <p className="display mt-2 text-4xl text-on-dark">
            {item.value.toLocaleString("ko-KR")}
            <span className="ml-1 text-base text-body-dark">{item.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
