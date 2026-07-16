import { Suspense } from "react";
import DataSourceBadge from "@/components/layout/DataSourceBadge";
import SearchExplorer from "@/components/search/SearchExplorer";
import { ALL_CATEGORIES } from "@/lib/categories";
import { buildMergedData } from "@/lib/merge";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const data = await buildMergedData();

  // 클라이언트로 보내는 슬림 프로젝션 (장문 필드 절단)
  const items = data.searchItems.map((item) => ({
    ...item,
    functionality:
      item.functionality.length > 90 ? `${item.functionality.slice(0, 90)}…` : item.functionality,
  }));

  const years = [
    ...new Set(items.map((d) => d.year).filter((y): y is number => y !== null)),
  ].sort((a, b) => b - a);
  const industries = [
    ...new Set(items.map((d) => d.industry).filter((v): v is string => Boolean(v && v !== "-"))),
  ].sort();
  const usedCategories = new Set(items.flatMap((d) => d.categories));
  const categories = ALL_CATEGORIES.filter((c) => usedCategories.has(c));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">원료·품목 검색</h1>
        <DataSourceBadge source={data.sources.ingredient} fetchedAt={data.fetchedAt} />
      </div>
      <p className="mt-3 max-w-2xl text-body">
        기능성 원료 인정 현황({data.ingredients.length.toLocaleString()}건)과 품목분류(
        {data.products.length.toLocaleString()}건)를 통합 검색합니다. 행을 클릭하면 섭취량·주의사항
        상세를 볼 수 있습니다.
      </p>
      <div className="mt-8">
        <Suspense>
          <SearchExplorer items={items} years={years} industries={industries} categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}
