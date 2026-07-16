import Link from "next/link";
import YearlyTrendChart from "@/components/charts/YearlyTrendChart";
import TopBarChart from "@/components/charts/TopBarChart";
import RecentApprovals from "@/components/dashboard/RecentApprovals";
import StatCards from "@/components/dashboard/StatCards";
import DataSourceBadge from "@/components/layout/DataSourceBadge";
import { recentApprovals, statCards, topCategories, topCompanies, yearlyTrend } from "@/lib/aggregate";
import { buildMergedData } from "@/lib/merge";

export default async function DashboardPage() {
  const data = await buildMergedData();
  const stats = statCards(data.ingredients, data.products);
  const trend = yearlyTrend(data.ingredients);
  const catTop = topCategories([...data.ingredients, ...data.products], 10);
  const companyTop = topCompanies(data.ingredients, 10);
  const recent = recentApprovals(data.ingredients, 10);

  return (
    <div>
      {/* hero-band-dark */}
      <section className="bg-canvas-dark">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="display text-4xl text-on-dark sm:text-5xl">건강기능식품 산업 동향</h1>
            <DataSourceBadge source={data.sources.ingredient} fetchedAt={data.fetchedAt} />
          </div>
          <p className="mt-4 max-w-xl text-lg text-body-dark">
            식약처 기능성 원료 인정 현황과 품목 데이터를 한눈에 — 유통업계를 위한 트렌드
            대시보드입니다.
          </p>
          <div className="mt-10">
            <StatCards stats={stats} />
          </div>
        </div>
      </section>

      {/* light canvas: 차트 */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="display text-3xl">연도별 기능성 원료 인정 추이</h2>
        <p className="mt-2 text-sm text-body">
          기능성 원료 인정(신규) 건수 기준 · 인정일자 미상 데이터는 제외
        </p>
        <div className="mt-6 rounded-lg bg-surface-card p-6">
          <YearlyTrendChart data={trend} />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="display text-2xl">기능성 카테고리 TOP 10</h2>
            <p className="mt-2 text-sm text-body">원료·품목의 기능성 내용 자동 분류 기준</p>
            <div className="mt-4 rounded-lg bg-surface-card p-6">
              <TopBarChart data={catTop} />
            </div>
          </div>
          <div>
            <h2 className="display text-2xl">원료 인정 업체 TOP 10</h2>
            <p className="mt-2 text-sm text-body">
              업체별 기능성 원료 인정 건수 ·{" "}
              <Link href="/companies" className="text-link hover:underline">
                업체 분석 전체 보기
              </Link>
            </p>
            <div className="mt-4 rounded-lg bg-surface-card p-6">
              <TopBarChart data={companyTop} />
            </div>
          </div>
        </div>
      </section>

      {/* 최근 인정 원료 */}
      <section className="bg-surface-soft">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="display text-3xl">최근 인정 원료</h2>
            <Link href="/search" className="text-sm font-medium text-link hover:underline">
              전체 검색 →
            </Link>
          </div>
          <div className="mt-6 rounded-lg bg-canvas p-6">
            <RecentApprovals items={recent} />
          </div>
        </div>
      </section>
    </div>
  );
}
