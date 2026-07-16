import Link from "next/link";
import TopBarChart from "@/components/charts/TopBarChart";
import CategoryChips from "@/components/shared/CategoryChips";
import DataSourceBadge from "@/components/layout/DataSourceBadge";
import { companyStats, regionDistribution } from "@/lib/aggregate";
import { buildMergedData } from "@/lib/merge";
import { companyKey } from "@/lib/normalize";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company: selectedRaw } = await searchParams;
  const data = await buildMergedData();
  const stats = companyStats(data.ingredients);
  const regions = regionDistribution(data.ingredients);

  const selectedKey = selectedRaw ? companyKey(selectedRaw) : null;
  const selected = selectedKey ? stats.find((c) => companyKey(c.name) === selectedKey) : null;
  const selectedIngredients = selected
    ? data.ingredients.filter((d) => companyKey(d.company) === companyKey(selected.name))
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">업체 분석</h1>
        <DataSourceBadge source={data.sources.ingredient} fetchedAt={data.fetchedAt} />
      </div>
      <p className="mt-3 max-w-2xl text-body">
        기능성 원료 인정 건수 기준 업체 랭킹과 지역 분포입니다. 업체명을 클릭하면 보유 원료
        목록을 확인할 수 있습니다.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        {/* 랭킹 테이블 */}
        <div className="lg:col-span-3">
          <h2 className="display text-2xl">업체 랭킹</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-hairline">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-card text-left text-mute">
                  <th className="px-4 py-3 font-medium">순위</th>
                  <th className="px-4 py-3 font-medium">업체명</th>
                  <th className="px-4 py-3 font-medium">업종</th>
                  <th className="px-4 py-3 font-medium">지역</th>
                  <th className="px-4 py-3 text-right font-medium">인정 건수</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice(0, 30).map((c, i) => {
                  const active = selected && companyKey(c.name) === companyKey(selected.name);
                  return (
                    <tr
                      key={c.name}
                      className={`border-b border-hairline last:border-b-0 ${active ? "bg-primary/5" : "hover:bg-surface-card"}`}
                    >
                      <td className="px-4 py-3 text-mute">{i + 1}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/companies?company=${encodeURIComponent(c.name)}`}
                          className="font-medium text-ink hover:text-link"
                          scroll={false}
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="max-w-44 truncate px-4 py-3 text-body">{c.industry}</td>
                      <td className="px-4 py-3 text-body">{c.region}</td>
                      <td className="px-4 py-3 text-right font-medium">{c.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {stats.length > 30 && (
            <p className="mt-2 text-xs text-mute">상위 30개 업체만 표시 (전체 {stats.length}곳)</p>
          )}
        </div>

        {/* 지역 분포 + 업체 상세 */}
        <div className="lg:col-span-2">
          <h2 className="display text-2xl">지역별 분포</h2>
          <p className="mt-2 text-sm text-body">업체 주소 기준 · 해외 소재는 해외/기타로 집계</p>
          <div className="mt-4 rounded-lg bg-surface-card p-6">
            <TopBarChart data={regions} height={Math.max(240, regions.length * 32)} />
          </div>

          {selected && (
            <div className="mt-8 rounded-lg bg-surface-dark-card p-6 text-on-dark">
              <p className="text-xs text-mute-dark">업체 상세</p>
              <h3 className="display mt-1 text-2xl">{selected.name}</h3>
              <p className="mt-2 text-sm text-body-dark">
                {selected.industry} · {selected.region}
              </p>
              {selected.address && <p className="mt-1 text-xs text-mute-dark">{selected.address}</p>}
              <p className="mt-4 text-sm font-semibold">보유 인정 원료 {selectedIngredients.length}건</p>
              <ul className="mt-2 max-h-80 overflow-y-auto">
                {selectedIngredients.map((d) => (
                  <li key={d.approvalNo + d.name} className="border-b border-hairline-dark py-2.5 last:border-b-0">
                    <Link
                      href={`/search?q=${encodeURIComponent(d.name)}`}
                      className="text-sm font-medium text-on-dark hover:text-link-dark"
                    >
                      {d.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-mute-dark">
                      <span>{d.dateLabel}</span>
                      <CategoryChips categories={d.categories.slice(0, 2)} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
