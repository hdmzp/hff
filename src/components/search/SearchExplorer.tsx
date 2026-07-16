"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import CategoryChips from "@/components/shared/CategoryChips";
import DetailDrawer from "@/components/search/DetailDrawer";
import type { SearchItem } from "@/lib/types";

const PAGE_SIZE = 50;

type SortKey = "date" | "name" | "company";

function exportCsv(rows: SearchItem[]) {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const header = ["구분", "이름", "업체명", "업종", "일자", "기능성 카테고리", "기능성 내용"];
  const lines = rows.map((r) =>
    [r.kind, r.name, r.company ?? "", r.industry ?? "", r.dateLabel, r.categories.join("|"), r.functionality]
      .map(esc)
      .join(","),
  );
  // ﻿ BOM: 엑셀에서 한글 인코딩 깨짐 방지
  const blob = new Blob(["﻿" + [header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `건기식_검색결과_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SearchExplorer({
  items,
  years,
  industries,
  categories,
}: {
  items: SearchItem[];
  years: number[];
  industries: string[];
  categories: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [keyword, setKeyword] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("cat") ?? "");
  const [year, setYear] = useState(params.get("year") ?? "");
  const [industry, setIndustry] = useState(params.get("ind") ?? "");
  const [kind, setKind] = useState(params.get("kind") ?? "");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 필터 상태를 URL에 반영 (공유 가능한 링크, 디바운스)
  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (urlTimer.current) clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      const next = new URLSearchParams();
      if (keyword) next.set("q", keyword);
      if (category) next.set("cat", category);
      if (year) next.set("year", year);
      if (industry) next.set("ind", industry);
      if (kind) next.set("kind", kind);
      router.replace(`/search${next.size ? `?${next}` : ""}`, { scroll: false });
    }, 300);
    return () => {
      if (urlTimer.current) clearTimeout(urlTimer.current);
    };
  }, [keyword, category, year, industry, kind, router]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    let rows = items.filter((item) => {
      if (kind && item.kind !== kind) return false;
      if (category && !item.categories.includes(category)) return false;
      if (year && String(item.year ?? "") !== year) return false;
      if (industry && item.industry !== industry) return false;
      if (kw) {
        const haystack = `${item.name} ${item.company ?? ""} ${item.functionality}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.dateLabel.localeCompare(b.dateLabel);
      if (sortKey === "name") cmp = a.name.localeCompare(b.name, "ko");
      if (sortKey === "company") cmp = (a.company ?? "").localeCompare(b.company ?? "", "ko");
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [items, keyword, category, year, industry, kind, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key !== "date");
    }
  }

  const selectClass =
    "rounded-sm border border-ash bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none";

  return (
    <div>
      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            resetPage();
          }}
          placeholder="원료명·품목명·업체명·기능성 검색"
          className="h-11 w-full max-w-sm rounded-full border border-ash bg-canvas px-5 text-sm focus:border-primary focus:outline-none"
        />
        <select value={kind} onChange={(e) => { setKind(e.target.value); resetPage(); }} className={selectClass}>
          <option value="">전체 구분</option>
          <option value="원료">원료</option>
          <option value="품목">품목</option>
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); resetPage(); }} className={selectClass}>
          <option value="">전체 기능성</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => { setYear(e.target.value); resetPage(); }} className={selectClass}>
          <option value="">전체 연도</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>{y}년</option>
          ))}
        </select>
        <select value={industry} onChange={(e) => { setIndustry(e.target.value); resetPage(); }} className={selectClass}>
          <option value="">전체 업종</option>
          {industries.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <button
          onClick={() => exportCsv(filtered)}
          disabled={filtered.length === 0}
          className="ml-auto rounded-full bg-primary px-5 py-2 text-sm font-bold tracking-[0.3px] text-on-primary hover:bg-primary-pressed active:bg-primary-active disabled:bg-surface-soft disabled:text-ash"
        >
          CSV 다운로드 ({filtered.length.toLocaleString()}건)
        </button>
      </div>

      {/* 결과 테이블 */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-hairline">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-card text-left text-mute">
              <th className="px-4 py-3 font-medium">구분</th>
              <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => toggleSort("name")}>
                이름 {sortKey === "name" && (sortAsc ? "↑" : "↓")}
              </th>
              <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => toggleSort("company")}>
                업체명 {sortKey === "company" && (sortAsc ? "↑" : "↓")}
              </th>
              <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => toggleSort("date")}>
                일자 {sortKey === "date" && (sortAsc ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 font-medium">기능성</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((item) => (
              <tr
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className="cursor-pointer border-b border-hairline last:border-b-0 hover:bg-surface-card"
              >
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.kind === "원료" ? "bg-primary/10 text-link" : "bg-surface-soft text-mute"
                    }`}
                  >
                    {item.kind}
                  </span>
                </td>
                <td className="max-w-64 truncate px-4 py-3 font-medium text-ink">{item.name}</td>
                <td className="max-w-48 truncate px-4 py-3 text-body">{item.company ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-body">{item.dateLabel}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <CategoryChips categories={item.categories.slice(0, 2)} />
                    <span className="hidden max-w-72 truncate text-body xl:inline">{item.functionality}</span>
                  </span>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-mute">
                  조건에 맞는 결과가 없습니다. 필터를 조정해 보세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="rounded-full border border-ash px-4 py-1.5 disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-mute">
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="rounded-full border border-ash px-4 py-1.5 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

      <DetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
