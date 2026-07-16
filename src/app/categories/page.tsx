import { Suspense } from "react";
import CategoriesView from "@/components/categories/CategoriesView";
import DataSourceBadge from "@/components/layout/DataSourceBadge";
import { loadDataset } from "@/lib/datasets";
import { buildMergedData } from "@/lib/merge";
import { buildTaxonomy } from "@/lib/taxonomy";

export default async function CategoriesPage() {
  const [nutrition, data] = await Promise.all([loadDataset("nutrition"), buildMergedData()]);
  const tree = buildTaxonomy(nutrition.rows);

  // 클라이언트 매칭용 슬림 프로젝션
  const items = data.searchItems.map((item) => ({
    ...item,
    functionality:
      item.functionality.length > 90 ? `${item.functionality.slice(0, 90)}…` : item.functionality,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">기능성 분류 탐색</h1>
        <DataSourceBadge source={nutrition.source} fetchedAt={nutrition.fetchedAt} />
      </div>
      <p className="mt-3 max-w-2xl text-body">
        영양DB의 대분류 → 중분류 → 소분류 체계를 탐색하고, 분류와 관련된 인정 원료·품목을
        확인합니다. 연결은 기능성 텍스트 기반 추정입니다.
      </p>
      <Suspense>
        <CategoriesView tree={tree} items={items} />
      </Suspense>
    </div>
  );
}
