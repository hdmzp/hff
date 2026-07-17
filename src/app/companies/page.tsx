import { Suspense } from "react";
import CompaniesView, { type CompanyIngredient } from "@/components/companies/CompaniesView";
import DataSourceBadge from "@/components/layout/DataSourceBadge";
import { companyStats, regionDistribution } from "@/lib/aggregate";
import { buildMergedData } from "@/lib/merge";
import { companyKey } from "@/lib/normalize";

export default async function CompaniesPage() {
  const data = await buildMergedData();
  const stats = companyStats(data.ingredients);
  const regions = regionDistribution(data.ingredients);

  // 업체 대표 표기명 → 보유 원료 (슬림 목록)
  const ingredientsByCompany: Record<string, CompanyIngredient[]> = {};
  for (const stat of stats) {
    ingredientsByCompany[stat.name] = data.ingredients
      .filter((d) => companyKey(d.company) === companyKey(stat.name))
      .map((d) => ({ name: d.name, dateLabel: d.dateLabel, categories: d.categories }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">업체 분석</h1>
        <DataSourceBadge
          datasetLabel="원료"
          source={data.sources.ingredient}
          fetchedAt={data.fetchedAts.ingredient}
        />
      </div>
      <p className="mt-3 max-w-2xl text-body">
        기능성 원료 인정 건수 기준 업체 랭킹과 지역 분포입니다. 업체명을 클릭하면 보유 원료
        목록을 확인할 수 있습니다.
      </p>
      <Suspense>
        <CompaniesView stats={stats} regions={regions} ingredientsByCompany={ingredientsByCompany} />
      </Suspense>
    </div>
  );
}
