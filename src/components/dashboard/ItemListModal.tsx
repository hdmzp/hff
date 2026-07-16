"use client";

import Link from "next/link";
import CategoryChips from "@/components/shared/CategoryChips";

export interface ListedItem {
  name: string;
  company?: string;
  dateLabel: string;
  categories: string[];
}

export default function ItemListModal({
  title,
  subtitle,
  items,
  searchHref,
  onClose,
}: {
  title: string;
  subtitle?: string;
  items: ListedItem[];
  searchHref?: string; // "전체 검색에서 보기" 링크
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[80vh] w-full max-w-xl flex-col rounded-lg bg-canvas p-6 shadow-[0_4px_12px_rgba(0,0,0,0.16)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="display text-2xl">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 rounded-full border border-ash px-3 py-1 text-sm text-mute hover:bg-surface-soft"
          >
            닫기 ✕
          </button>
        </div>

        <ul className="mt-4 flex-1 overflow-y-auto">
          {items.map((item, i) => (
            <li
              key={item.name + item.dateLabel + i}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-hairline py-2.5 last:border-b-0"
            >
              <Link
                href={`/search?q=${encodeURIComponent(item.name)}`}
                className="min-w-0 flex-1 truncate font-medium text-ink hover:text-link"
              >
                {item.name}
              </Link>
              {item.company && (
                <span className="hidden max-w-40 truncate text-xs text-body sm:inline">{item.company}</span>
              )}
              <span className="text-xs text-mute">{item.dateLabel}</span>
              <CategoryChips categories={item.categories.slice(0, 2)} />
            </li>
          ))}
          {items.length === 0 && (
            <li className="py-8 text-center text-sm text-mute">해당하는 원료가 없습니다.</li>
          )}
        </ul>

        {searchHref && (
          <div className="mt-4 border-t border-hairline pt-3 text-right">
            <Link href={searchHref} className="text-sm font-medium text-link hover:underline">
              원료·품목 검색에서 전체 보기 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
