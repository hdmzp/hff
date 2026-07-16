import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
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

const LIVE_DIR = path.join(process.cwd(), "data", "live");

interface LiveFile {
  fetchedAt: string;
  rows: Record<string, string>[];
}

/**
 * 정적 빌드 시점에 데이터를 읽는다.
 * CI(scripts/fetch-data.mjs)가 받아둔 data/live/*.json 이 있으면 그것을,
 * 없으면 내장 샘플 데이터를 사용한다.
 */
async function loadDatasetUncached<N extends DatasetName>(name: N): Promise<DataResult<RowOf<N>>> {
  if ((process.env.USE_MOCK_DATA ?? "").trim() === "1") {
    return { rows: MOCKS[name] as unknown as RowOf<N>[], source: "mock" };
  }
  try {
    const raw = await readFile(path.join(LIVE_DIR, `${name}.json`), "utf8");
    const parsed = JSON.parse(raw) as LiveFile;
    if (Array.isArray(parsed.rows) && parsed.rows.length > 0) {
      return {
        rows: parsed.rows as unknown as RowOf<N>[],
        source: "api",
        fetchedAt: parsed.fetchedAt,
      };
    }
  } catch {
    // live 파일 없음 → 샘플 데이터
  }
  return { rows: MOCKS[name] as unknown as RowOf<N>[], source: "mock" };
}

/** 요청(빌드) 단위로 중복 호출을 막기 위해 React cache()로 래핑 */
export const loadDataset = cache(loadDatasetUncached) as typeof loadDatasetUncached;
