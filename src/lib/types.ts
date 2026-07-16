// 식품안전나라 OPEN API 원시 row 타입 (필드명은 API 스펙 그대로)

/** ① 건강기능식품 기능성 원료인정 현황 */
export interface RawIngredientApproval {
  HF_FNCLTY_MTRAL_RCOGN_NO: string; // 인정번호
  PRMS_DT: string; // 인정일자
  BSSH_NM: string; // 업체명
  INDUTY_NM: string; // 업종
  ADDR: string; // 주소
  APLC_RAWMTRL_NM: string; // 신청원료명
  FNCLTY_CN: string; // 기능성 내용
  DAY_INTK_CN: string; // 1일 섭취량
  IFTKN_ATNT_MATR_CN: string; // 섭취시 주의사항
}

/** ② 건강기능식품 개별인정형 정보 */
export interface RawIndividualInfo {
  HF_FNCLTY_MTRAL_RCOGN_NO: string; // 원료인정번호
  DAY_INTK_HIGHLIMIT: string; // 1일 섭취량 상한
  DAY_INTK_LOWLIMIT: string; // 1일 섭취량 하한
  WT_UNIT: string; // 중량 단위
  RAWMTRL_NM: string; // 원재료명
  IFTKN_ATNT_MATR_CN: string; // 섭취시 주의사항
  PRIMARY_FNCLTY: string; // 주된 기능성
}

/** ③ 건강기능식품 품목분류정보 */
export interface RawProduct {
  PRDCT_NM: string; // 품목명
  BSSH_NM?: string; // 업체명 (data.go.kr 경유 데이터에만 존재)
  IFTKN_ATNT_MATR_CN: string; // 섭취시 주의사항
  PRIMARY_FNCLTY: string; // 주된 기능성
  DAY_INTK_LOWLIMIT: string;
  DAY_INTK_HIGHLIMIT: string;
  INTK_UNIT: string;
  INTK_MEMO: string;
  SKLL_IX_IRDNT_RAWMTRL: string; // 성분명
  CRET_DTM: string; // 최초등록일
  LAST_UPDT_DTM: string; // 최종수정일
}

/** ④ 건강기능식품 영양DB (기능성 분류 체계) */
export interface RawNutritionEntry {
  HELT_ITM_GRP_CD: string;
  HELT_ITM_GRP_NM: string;
  LCLAS_CD: string;
  LCLAS_NM: string;
  MLSFC_CD: string;
  MLSFC_NM: string;
  SCLAS_CD: string;
  SCLAS_NM: string;
}

export type DatasetName = "ingredient" | "individual" | "product" | "nutrition";

export type RowOf<N extends DatasetName> = N extends "ingredient"
  ? RawIngredientApproval
  : N extends "individual"
    ? RawIndividualInfo
    : N extends "product"
      ? RawProduct
      : RawNutritionEntry;

export type DataSource = "api" | "cache" | "stale-cache" | "mock";

export interface DataResult<T> {
  rows: T[];
  source: DataSource;
  fetchedAt?: string;
}

// ---- 정규화/병합 후 도메인 타입 ----

/** 통합 검색 레코드 (원료 + 품목) */
export interface SearchItem {
  id: string; // "ing:{인정번호}" | "prd:{index}"
  kind: "원료" | "품목";
  name: string;
  company?: string;
  industry?: string;
  year: number | null;
  dateLabel: string;
  categories: string[]; // 기능성 카테고리 (다중)
  functionality: string; // 기능성 원문
}

/** 원료 상세 (①⟕② 병합) */
export interface IngredientDetail {
  approvalNo: string;
  name: string;
  company: string;
  industry: string;
  address: string;
  region: string;
  dateLabel: string;
  year: number | null;
  functionality: string;
  dailyIntake: string;
  caution: string;
  categories: string[];
  // ②에서 병합 (없을 수 있음)
  individual?: {
    rawMaterial: string;
    intakeLow: string;
    intakeHigh: string;
    unit: string;
    primaryFunctionality: string;
    caution: string;
  };
  relatedProducts: string[]; // ③ 퍼지 매칭 (추정)
}

/** 품목 상세 */
export interface ProductDetail {
  name: string;
  company?: string;
  functionality: string;
  ingredients: string;
  intakeLow: string;
  intakeHigh: string;
  unit: string;
  memo: string;
  caution: string;
  createdLabel: string;
  year: number | null;
  categories: string[];
}
