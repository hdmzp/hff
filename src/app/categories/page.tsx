import Link from "next/link";
import TaxonomyTree from "@/components/categories/TaxonomyTree";
import CategoryChips from "@/components/shared/CategoryChips";
import DataSourceBadge from "@/components/layout/DataSourceBadge";
import { loadDataset } from "@/lib/datasets";
import { buildMergedData } from "@/lib/merge";
import { buildTaxonomy, findNode, relatedItems } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ node?: string }>;
}) {
  const { node: nodeCode } = await searchParams;
  const [nutrition, data] = await Promise.all([loadDataset("nutrition"), buildMergedData()]);
  const tree = buildTaxonomy(nutrition.rows);
  const selected = nodeCode ? findNode(tree, nodeCode) : null;
  const related = selected ? relatedItems(selected.name, data.searchItems) : [];

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

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <aside className="rounded-lg border border-hairline p-5 lg:col-span-1">
          <TaxonomyTree tree={tree} selected={selected?.code ?? null} />
        </aside>

        <section className="lg:col-span-2">
          {!selected && (
            <div className="flex h-full min-h-64 items-center justify-center rounded-lg bg-surface-card">
              <p className="text-body">왼쪽에서 분류를 선택하면 관련 원료·품목이 표시됩니다.</p>
            </div>
          )}
          {selected && (
            <div>
              <h2 className="display text-3xl">{selected.name}</h2>
              <p className="mt-2 text-sm text-body">
                관련 원료·품목 {related.length}건{related.length >= 50 && " (상위 50건 표시)"}
              </p>
              {related.length === 0 ? (
                <div className="mt-6 rounded-lg bg-surface-card p-8 text-center">
                  <p className="text-body">이 분류에 직접 매칭되는 원료·품목이 없습니다.</p>
                  <p className="mt-1 text-sm text-mute">
                    자동 텍스트 매칭의 한계로 실제 관련 항목이 있어도 표시되지 않을 수 있습니다.
                  </p>
                </div>
              ) : (
                <ul className="mt-6 divide-y divide-hairline rounded-lg border border-hairline">
                  {related.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.kind === "원료" ? "bg-primary/10 text-link" : "bg-surface-soft text-mute"
                        }`}
                      >
                        {item.kind}
                      </span>
                      <Link
                        href={`/search?q=${encodeURIComponent(item.name)}`}
                        className="min-w-0 flex-1 truncate font-medium text-ink hover:text-link"
                      >
                        {item.name}
                      </Link>
                      <span className="hidden text-sm text-body sm:inline">{item.dateLabel}</span>
                      <CategoryChips categories={item.categories.slice(0, 2)} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
