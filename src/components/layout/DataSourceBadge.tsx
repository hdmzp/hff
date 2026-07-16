import type { DataSource } from "@/lib/types";

const STYLES: Record<DataSource, { label: string; className: string }> = {
  api: { label: "식약처 데이터", className: "bg-primary text-on-primary" },
  cache: { label: "캐시 데이터", className: "bg-surface-soft text-mute" },
  "stale-cache": { label: "캐시 (갱신 실패)", className: "bg-warning/10 text-warning" },
  mock: { label: "샘플 데이터", className: "bg-[#fff4e0] text-[#a05a00]" },
};

export default function DataSourceBadge({ source, fetchedAt }: { source: DataSource; fetchedAt?: string }) {
  const { label, className } = STYLES[source];
  const time = fetchedAt
    ? new Date(fetchedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })
    : null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
      {time && <span className="opacity-70">· {time} 기준</span>}
    </span>
  );
}
