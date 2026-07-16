"use client";

import Link from "next/link";
import { useState } from "react";
import TopBarChart from "@/components/charts/TopBarChart";
import YearlyTrendChart from "@/components/charts/YearlyTrendChart";
import ItemListModal, { type ListedItem } from "@/components/dashboard/ItemListModal";
import type { NamedCount, YearCount } from "@/lib/aggregate";
import { companyKey } from "@/lib/normalize";

/** 대시보드 팝업용 슬림 원료 레코드 */
export interface SlimIngredient {
  name: string;
  company: string;
  year: number | null;
  dateLabel: string;
  categories: string[];
}

interface ModalState {
  title: string;
  subtitle?: string;
  items: ListedItem[];
  searchHref?: string;
}

function sortByDateDesc(items: ListedItem[]): ListedItem[] {
  return [...items].sort((a, b) => (b.dateLabel > a.dateLabel ? 1 : -1));
}

export default function DashboardCharts({
  trend,
  catTop,
  companyTop,
  ingredients,
}: {
  trend: YearCount[];
  catTop: NamedCount[];
  companyTop: NamedCount[];
  ingredients: SlimIngredient[];
}) {
  const [modal, setModal] = useState<ModalState | null>(null);

  function openYear(year: number) {
    const items = sortByDateDesc(ingredients.filter((d) => d.year === year));
    setModal({
      title: `${year}년 인정 원료 ${items.length}건`,
      subtitle: "원료를 클릭하면 검색으로 이동합니다",
      items,
      searchHref: `/search?kind=${encodeURIComponent("원료")}&year=${year}`,
    });
  }

  function openCategory(category: string) {
    const items = sortByDateDesc(ingredients.filter((d) => d.categories.includes(category)));
    setModal({
      title: `${category} — 인정 원료 ${items.length}건`,
      subtitle: "원료 기준 목록 · 품목 포함 전체는 검색에서 확인하세요",
      items,
      searchHref: `/search?cat=${encodeURIComponent(category)}`,
    });
  }

  function openCompany(name: string) {
    const key = companyKey(name);
    const items = sortByDateDesc(ingredients.filter((d) => companyKey(d.company) === key));
    setModal({
      title: `${name} — 인정 원료 ${items.length}건`,
      subtitle: "원료를 클릭하면 검색으로 이동합니다",
      items,
      searchHref: `/companies?company=${encodeURIComponent(name)}`,
    });
  }

  return (
    <div>
      <h2 className="display text-3xl">연도별 기능성 원료 인정 추이</h2>
      <p className="mt-2 text-sm text-body">
        막대를 클릭하면 그 해 인정받은 원료 목록을 볼 수 있습니다 · 인정일자 미상 데이터는 제외
      </p>
      <div className="mt-6 rounded-lg bg-surface-card p-6">
        <YearlyTrendChart data={trend} onBarClick={openYear} />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="display text-2xl">기능성 카테고리 TOP 10</h2>
          <p className="mt-2 text-sm text-body">막대를 클릭하면 해당 기능성의 원료 목록 표시</p>
          <div className="mt-4 rounded-lg bg-surface-card p-6">
            <TopBarChart data={catTop} onBarClick={openCategory} />
          </div>
        </div>
        <div>
          <h2 className="display text-2xl">원료 인정 업체 TOP 10</h2>
          <p className="mt-2 text-sm text-body">
            막대를 클릭하면 보유 원료 목록 표시 ·{" "}
            <Link href="/companies" className="text-link hover:underline">
              업체 분석 전체 보기
            </Link>
          </p>
          <div className="mt-4 rounded-lg bg-surface-card p-6">
            <TopBarChart data={companyTop} onBarClick={openCompany} />
          </div>
        </div>
      </div>

      {modal && (
        <ItemListModal
          title={modal.title}
          subtitle={modal.subtitle}
          items={modal.items}
          searchHref={modal.searchHref}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
