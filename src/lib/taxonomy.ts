import { categorize, OTHER_CATEGORY } from "./categories";
import type { RawNutritionEntry, SearchItem } from "./types";

export interface TaxonomyNode {
  code: string;
  name: string;
  children: TaxonomyNode[];
}

/** 영양DB 행들을 대분류 → 중분류 → 소분류 트리로 구성 */
export function buildTaxonomy(rows: RawNutritionEntry[]): TaxonomyNode[] {
  const groups = new Map<string, TaxonomyNode>();
  for (const row of rows) {
    const gKey = row.HELT_ITM_GRP_CD || row.HELT_ITM_GRP_NM;
    let group = groups.get(gKey);
    if (!group) {
      group = { code: gKey, name: row.HELT_ITM_GRP_NM || "미분류", children: [] };
      groups.set(gKey, group);
    }
    let lclas = group.children.find((n) => n.code === row.LCLAS_CD);
    if (!lclas) {
      lclas = { code: row.LCLAS_CD, name: row.LCLAS_NM || "-", children: [] };
      group.children.push(lclas);
    }
    let mid = lclas.children.find((n) => n.code === row.MLSFC_CD);
    if (!mid) {
      mid = { code: row.MLSFC_CD, name: row.MLSFC_NM || "-", children: [] };
      lclas.children.push(mid);
    }
    if (row.SCLAS_CD && !mid.children.some((n) => n.code === row.SCLAS_CD)) {
      mid.children.push({ code: row.SCLAS_CD, name: row.SCLAS_NM || "-", children: [] });
    }
  }
  return [...groups.values()];
}

export function findNode(tree: TaxonomyNode[], code: string): TaxonomyNode | null {
  for (const node of tree) {
    if (node.code === code) return node;
    const found = findNode(node.children, code);
    if (found) return found;
  }
  return null;
}

/**
 * 분류명과 관련된 원료·품목 찾기 (휴리스틱).
 * 1) 분류명을 기능성 카테고리로 변환해 카테고리 교집합 매칭
 * 2) 실패 시 분류명 원문의 부분문자열 매칭
 */
export function relatedItems(nodeName: string, items: SearchItem[], limit = 50): SearchItem[] {
  const nodeCategories = categorize(nodeName).filter((c) => c !== OTHER_CATEGORY);
  if (nodeCategories.length > 0) {
    return items
      .filter((item) => item.categories.some((c) => nodeCategories.includes(c)))
      .slice(0, limit);
  }
  const needle = nodeName.replace(/\s+/g, "").toLowerCase();
  if (needle.length < 2) return [];
  return items
    .filter((item) =>
      `${item.name}${item.functionality}`.replace(/\s+/g, "").toLowerCase().includes(needle),
    )
    .slice(0, limit);
}
