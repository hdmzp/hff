import Link from "next/link";
import DashboardCharts, { type SlimIngredient } from "@/components/dashboard/DashboardCharts";
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

  // 차트 팝업용 슬림 프로젝션 (장문 필드 제외)
  const slimIngredients: SlimIngredient[] = data.ingredients.map((d) => ({
    name: d.name,
    company: d.company,
    year: d.year,
    dateLabel: d.dateLabel,
    categories: d.categories,
  }));

  return (
    <div>
      {/* hero-band-dark */}
      <section className="bg-canvas-dark">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="display text-4xl text-on-dark sm:text-5xl">건강기능식품 산업 동향</h1>
            <span className="flex flex-wrap items-center gap-2">
              <DataSourceBadge
                datasetLabel="원료"
                source={data.sources.ingredient}
                fetchedAt={data.fetchedAts.ingredient}
              />
              <DataSourceBadge
                datasetLabel="품목"
                source={data.sources.product}
                fetchedAt={data.fetchedAts.product}
              />
            </span>
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

      {/* light canvas: 인터랙티브 차트 */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <DashboardCharts
          trend={trend}
          catTop={catTop}
          companyTop={companyTop}
          ingredients={slimIngredients}
        />
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
