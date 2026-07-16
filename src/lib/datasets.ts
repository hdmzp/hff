import { cache } from "react";
import { fetchAllRows } from "./api-client";
import { readCache, writeCache, clearCache } from "./cache";
import { getConfig } from "./config";
import type { DataResult, DatasetName, RowOf } from "./types";

import mockIngredient from "../../data/mock/ingredient-approvals.json";
import mockIndividual from "../../data/mock/individual-info.json";
import mockProduct from "../../data/mock/products.json";
import mockNutrition from "../../data/mock/nutrition-db.json";

const MOCKS: Record<DatasetName, Record<string, string>[]> = {
  ingredient: mockIngredient as Record<string, string>[],
  individual: mockIndividual as Record<string, string>[],
  product: mockProduct as Record<string, string>[],
  nutrition: mockNutrition as Record<string, string>[],
};

// API 실패 직후에는 잠시 재시도를 건너뛰어 페이지 로딩이 타임아웃에 붙잡히지 않게 한다
const FAILURE_BACKOFF_MS = 60_000;
const lastFailureAt = new Map<DatasetName, number>();

async function loadDatasetUncached<N extends DatasetName>(
  name: N,
  opts?: { forceRefresh?: boolean },
): Promise<DataResult<RowOf<N>>> {
  const config = getConfig();
  const serviceId = config.serviceIds[name];

  if (config.useMockData || !serviceId || !config.apiKey) {
    return { rows: MOCKS[name] as unknown as RowOf<N>[], source: "mock" };
  }

  const cached = opts?.forceRefresh ? null : await readCache(name);
  if (cached?.fresh) {
    return { rows: cached.rows as unknown as RowOf<N>[], source: "cache", fetchedAt: cached.fetchedAt };
  }

  const failedAt = lastFailureAt.get(name);
  if (!opts?.forceRefresh && failedAt && Date.now() - failedAt < FAILURE_BACKOFF_MS) {
    if (cached) {
      return { rows: cached.rows as unknown as RowOf<N>[], source: "stale-cache", fetchedAt: cached.fetchedAt };
    }
    return { rows: MOCKS[name] as unknown as RowOf<N>[], source: "mock" };
  }

  try {
    const rows = await fetchAllRows(serviceId);
    if (rows.length === 0) throw new Error("API가 0건을 반환했습니다.");
    // 캐시 쓰기 실패(읽기 전용 파일시스템 등)가 API 성공을 무효화하면 안 된다
    let fetchedAt = new Date().toISOString();
    try {
      fetchedAt = await writeCache(name, rows);
    } catch (cacheErr) {
      console.warn(`[foodsafety] ${name} 캐시 저장 실패:`, cacheErr instanceof Error ? cacheErr.message : cacheErr);
    }
    lastFailureAt.delete(name);
    return { rows: rows as unknown as RowOf<N>[], source: "api", fetchedAt };
  } catch (err) {
    lastFailureAt.set(name, Date.now());
    console.error(`[foodsafety] ${name} 조회 실패:`, err instanceof Error ? err.message : err);
    const stale = cached ?? (await readCache(name));
    if (stale) {
      return { rows: stale.rows as unknown as RowOf<N>[], source: "stale-cache", fetchedAt: stale.fetchedAt };
    }
    return { rows: MOCKS[name] as unknown as RowOf<N>[], source: "mock" };
  }
}

/** 요청 단위로 중복 호출을 막기 위해 React cache()로 래핑 */
export const loadDataset = cache(loadDatasetUncached) as typeof loadDatasetUncached;

export async function refreshDataset(name: DatasetName): Promise<{ source: string; rowCount: number }> {
  await clearCache(name);
  const result = await loadDatasetUncached(name, { forceRefresh: true });
  return { source: result.source, rowCount: result.rows.length };
}
