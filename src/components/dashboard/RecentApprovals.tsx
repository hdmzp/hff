import Link from "next/link";
import CategoryChips from "@/components/shared/CategoryChips";
import type { IngredientDetail } from "@/lib/types";

export default function RecentApprovals({ items }: { items: IngredientDetail[] }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-mute">최근 인정 내역이 없습니다.</p>;
  }
  return (
    <ul>
      {items.map((item) => (
        <li
          key={item.approvalNo + item.name}
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-hairline py-3 last:border-b-0"
        >
          <span className="w-24 shrink-0 text-sm text-mute">{item.dateLabel}</span>
          <Link
            href={`/search?q=${encodeURIComponent(item.name)}`}
            className="min-w-0 flex-1 truncate font-medium text-ink hover:text-link"
          >
            {item.name}
          </Link>
          <span className="hidden max-w-48 truncate text-sm text-body sm:inline">{item.company}</span>
          <CategoryChips categories={item.categories.slice(0, 2)} />
        </li>
      ))}
    </ul>
  );
}
