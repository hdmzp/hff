import { companyKey } from "./normalize";
import type { IngredientDetail, ProductDetail } from "./types";

export interface YearCount {
  year: number;
  count: number;
}

/** 연도별 원료 인정 건수 (연도 미상 제외) */
export function yearlyTrend(ingredients: IngredientDetail[]): YearCount[] {
  const counts = new Map<number, number>();
  for (const d of ingredients) {
    if (d.year === null) continue;
    counts.set(d.year, (counts.get(d.year) ?? 0) + 1);
  }
  const years = [...counts.keys()];
  if (years.length === 0) return [];
  const min = Math.min(...years);
  const max = Math.max(...years);
  const result: YearCount[] = [];
  for (let y = min; y <= max; y++) result.push({ year: y, count: counts.get(y) ?? 0 });
  return result;
}

export interface NamedCount {
  name: string;
  count: number;
}

export function topCategories(items: { categories: string[] }[], limit = 10): NamedCount[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const c of item.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface CompanyStat {
  name: string; // 대표 표기
  count: number;
  industry: string;
  region: string;
  address: string;
}

/** 업체별 인정 건수 ((주) 등 제거 후 그룹핑, 최다 표기를 대표로) */
export function companyStats(ingredients: IngredientDetail[]): CompanyStat[] {
  const groups = new Map<string, { names: Map<string, number>; count: number; industry: string; region: string; address: string }>();
  for (const d of ingredients) {
    const key = companyKey(d.company);
    if (!key) continue;
    let g = groups.get(key);
    if (!g) {
      g = { names: new Map(), count: 0, industry: d.industry, region: d.region, address: d.address };
      groups.set(key, g);
    }
    g.count++;
    g.names.set(d.company, (g.names.get(d.company) ?? 0) + 1);
  }
  return [...groups.values()]
    .map((g) => ({
      name: [...g.names.entries()].sort((a, b) => b[1] - a[1])[0][0],
      count: g.count,
      industry: g.industry,
      region: g.region,
      address: g.address,
    }))
    .sort((a, b) => b.count - a.count);
}

export function topCompanies(ingredients: IngredientDetail[], limit = 10): NamedCount[] {
  return companyStats(ingredients)
    .slice(0, limit)
    .map((c) => ({ name: c.name, count: c.count }));
}

export function regionDistribution(ingredients: IngredientDetail[]): NamedCount[] {
  const counts = new Map<string, number>();
  for (const d of ingredients) counts.set(d.region, (counts.get(d.region) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export interface StatCards {
  totalIngredients: number;
  totalProducts: number;
  totalCompanies: number;
  newThisYear: number;
  latestYear: number | null;
}

export function statCards(ingredients: IngredientDetail[], products: ProductDetail[]): StatCards {
  const companies = new Set(ingredients.map((d) => companyKey(d.company)).filter(Boolean));
  const years = ingredients.map((d) => d.year).filter((y): y is number => y !== null);
  const latestYear = years.length > 0 ? Math.max(...years) : null;
  return {
    totalIngredients: ingredients.length,
    totalProducts: products.length,
    totalCompanies: companies.size,
    newThisYear: latestYear === null ? 0 : ingredients.filter((d) => d.year === latestYear).length,
    latestYear,
  };
}

/** 최근 인정 원료 (인정일자 내림차순) */
export function recentApprovals(ingredients: IngredientDetail[], limit = 10): IngredientDetail[] {
  return [...ingredients]
    .sort((a, b) => (b.dateLabel > a.dateLabel ? 1 : -1))
    .filter((d) => d.year !== null)
    .slice(0, limit);
}
