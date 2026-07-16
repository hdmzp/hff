import { cache } from "react";
import { categorize } from "./categories";
import { loadDataset } from "./datasets";
import { extractRegion, formatDate, parseYear } from "./normalize";
import type {
  DataSource,
  IngredientDetail,
  ProductDetail,
  RawIngredientApproval,
  RawIndividualInfo,
  RawProduct,
  SearchItem,
} from "./types";

function normText(s?: string): string {
  return (s ?? "").replace(/[\s()\[\]·,./-]/g, "").toLowerCase();
}

/** 원료명 ↔ 품목 성분명 퍼지 매칭 (양방향 includes, 4자 이상만) */
function fuzzyMatch(a: string, b: string): boolean {
  const na = normText(a);
  const nb = normText(b);
  if (na.length < 4 || nb.length < 4) return na === nb && na.length > 0;
  return na.includes(nb) || nb.includes(na);
}

export interface MergedData {
  ingredients: IngredientDetail[];
  products: ProductDetail[];
  searchItems: SearchItem[];
  sources: { ingredient: DataSource; individual: DataSource; product: DataSource };
  fetchedAt?: string;
}

async function buildMergedDataUncached(): Promise<MergedData> {
  const [ing, ind, prd] = await Promise.all([
    loadDataset("ingredient"),
    loadDataset("individual"),
    loadDataset("product"),
  ]);

  const indByNo = new Map<string, RawIndividualInfo>();
  for (const row of ind.rows as RawIndividualInfo[]) {
    const no = (row.HF_FNCLTY_MTRAL_RCOGN_NO ?? "").trim();
    if (no) indByNo.set(no, row);
  }

  const ingredients: IngredientDetail[] = (ing.rows as RawIngredientApproval[]).map((row) => {
    const no = (row.HF_FNCLTY_MTRAL_RCOGN_NO ?? "").trim();
    const matched = indByNo.get(no);
    return {
      approvalNo: no,
      name: row.APLC_RAWMTRL_NM?.trim() || "(원료명 없음)",
      company: row.BSSH_NM?.trim() || "-",
      industry: row.INDUTY_NM?.trim() || "-",
      address: row.ADDR?.trim() || "",
      region: extractRegion(row.ADDR),
      dateLabel: formatDate(row.PRMS_DT),
      year: parseYear(row.PRMS_DT),
      functionality: row.FNCLTY_CN?.trim() || "",
      dailyIntake: row.DAY_INTK_CN?.trim() || "-",
      caution: row.IFTKN_ATNT_MATR_CN?.trim() || "-",
      categories: categorize(row.FNCLTY_CN, matched?.PRIMARY_FNCLTY),
      individual: matched
        ? {
            rawMaterial: matched.RAWMTRL_NM?.trim() || "-",
            intakeLow: matched.DAY_INTK_LOWLIMIT?.trim() || "-",
            intakeHigh: matched.DAY_INTK_HIGHLIMIT?.trim() || "-",
            unit: matched.WT_UNIT?.trim() || "",
            primaryFunctionality: matched.PRIMARY_FNCLTY?.trim() || "-",
            caution: matched.IFTKN_ATNT_MATR_CN?.trim() || "-",
          }
        : undefined,
      relatedProducts: [],
    };
  });

  const products: ProductDetail[] = (prd.rows as RawProduct[]).map((row) => ({
    name: row.PRDCT_NM?.trim() || "(품목명 없음)",
    functionality: row.PRIMARY_FNCLTY?.trim() || "",
    ingredients: row.SKLL_IX_IRDNT_RAWMTRL?.trim() || "-",
    intakeLow: row.DAY_INTK_LOWLIMIT?.trim() || "-",
    intakeHigh: row.DAY_INTK_HIGHLIMIT?.trim() || "-",
    unit: row.INTK_UNIT?.trim() || "",
    memo: row.INTK_MEMO?.trim() || "",
    caution: row.IFTKN_ATNT_MATR_CN?.trim() || "-",
    createdLabel: formatDate(row.CRET_DTM),
    year: parseYear(row.CRET_DTM),
    categories: categorize(row.PRIMARY_FNCLTY),
  }));

  // 원료 ↔ 품목 퍼지 연결 (공유 키가 없어 "추정" 수준)
  for (const ingredient of ingredients) {
    const related: string[] = [];
    for (const product of products) {
      if (related.length >= 10) break;
      if (fuzzyMatch(ingredient.name, product.ingredients) || fuzzyMatch(ingredient.name, product.name)) {
        related.push(product.name);
      }
    }
    ingredient.relatedProducts = related;
  }

  const searchItems: SearchItem[] = [
    ...ingredients.map(
      (d, i): SearchItem => ({
        id: `ing:${d.approvalNo || i}`,
        kind: "원료",
        name: d.name,
        company: d.company,
        industry: d.industry,
        year: d.year,
        dateLabel: d.dateLabel,
        categories: d.categories,
        functionality: d.functionality,
      }),
    ),
    ...products.map(
      (d, i): SearchItem => ({
        id: `prd:${i}`,
        kind: "품목",
        name: d.name,
        year: d.year,
        dateLabel: d.createdLabel,
        categories: d.categories,
        functionality: d.functionality,
      }),
    ),
  ];

  return {
    ingredients,
    products,
    searchItems,
    sources: { ingredient: ing.source, individual: ind.source, product: prd.source },
    fetchedAt: ing.fetchedAt,
  };
}

export const buildMergedData = cache(buildMergedDataUncached);

export function findItemById(data: MergedData, id: string): IngredientDetail | ProductDetail | null {
  if (id.startsWith("ing:")) {
    const no = id.slice(4);
    return data.ingredients.find((d, i) => (d.approvalNo || String(i)) === no) ?? null;
  }
  if (id.startsWith("prd:")) {
    const idx = Number(id.slice(4));
    return data.products[idx] ?? null;
  }
  return null;
}
