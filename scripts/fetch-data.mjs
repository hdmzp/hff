#!/usr/bin/env node
// 빌드 전에 식품안전나라 OPEN API에서 전체 데이터를 받아 data/live/*.json 으로 저장한다.
// CI(GitHub Actions)가 매일 실행하며, 실패한 데이터셋은 건너뛰어 내장 샘플 데이터로 빌드된다.
//
// 필요 env: FOODSAFETY_API_KEY, FSK_SERVICE_INGREDIENT/INDIVIDUAL/PRODUCT/NUTRITION
// (.env.local 이 있으면 자동으로 읽는다 — 로컬 실행용)

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // 없으면 process.env만 사용
  }
  return env;
}

const env = loadEnv();
const KEY = (env.FOODSAFETY_API_KEY ?? "").trim();
const BASE = (env.FOODSAFETY_BASE_URL ?? "http://openapi.foodsafetykorea.go.kr/api").trim();
// Cloudflare Worker 프록시 (해외 IP 차단 우회) — 설정 시 식품안전나라 호출을 프록시로 대체
const PROXY_URL = (env.FOODSAFETY_PROXY_URL ?? "").trim().replace(/\/$/, "");
const PROXY_TOKEN = (env.FOODSAFETY_PROXY_TOKEN ?? "").trim();

const DATASETS = [
  { name: "ingredient", envVar: "FSK_SERVICE_INGREDIENT", label: "기능성 원료인정 현황" },
  { name: "individual", envVar: "FSK_SERVICE_INDIVIDUAL", label: "개별인정형 정보" },
  { name: "product", envVar: "FSK_SERVICE_PRODUCT", label: "품목분류정보" },
  { name: "nutrition", envVar: "FSK_SERVICE_NUTRITION", label: "영양DB" },
];

const PAGE_SIZE = 1000;
const MAX_ROWS = 50_000;
const OUT_DIR = path.join(process.cwd(), "data", "live");

async function fetchPage(serviceId, start, end) {
  // 직접 호출(http/https) 실패 시 프록시로 재시도
  const bases = BASE.startsWith("http://") ? [BASE, BASE.replace("http://", "https://")] : [BASE];
  if (PROXY_URL) bases.push(`${PROXY_URL}/api`);
  let lastErr;
  let text = "";
  for (const base of bases) {
    try {
      const url = `${base}/${KEY}/${serviceId}/json/${start}/${end}`;
      const headers = PROXY_URL && base.startsWith(PROXY_URL) && PROXY_TOKEN ? { "x-proxy-token": PROXY_TOKEN } : {};
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(25_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      text = await res.text();
      return parseEnvelope(serviceId, text);
    } catch (err) {
      lastErr = err;
    }
  }
  // JSON 이 아닌 HTML 이 돌아오면 해외 IP 차단 안내 페이지일 가능성이 큼
  if (text.trimStart().startsWith("<")) {
    throw new Error("HTML 응답 수신 — 해외 IP 차단으로 추정 (한국 IP에서 scripts/fetch-data.mjs 실행 필요)");
  }
  throw lastErr;
}

function parseEnvelope(serviceId, text) {
  const json = JSON.parse(text);
  const envelope = json[serviceId];
  if (!envelope) {
    const code = json?.RESULT?.CODE ?? "?";
    throw new Error(`응답에 데이터 없음 (${code}: ${json?.RESULT?.MSG ?? ""})`);
  }
  const code = envelope.RESULT?.CODE ?? "";
  if (code !== "INFO-000" && code !== "INFO-200") {
    throw new Error(`${code}: ${envelope.RESULT?.MSG ?? "API 오류"}`);
  }
  return envelope;
}

async function fetchAllRows(serviceId) {
  const rows = [];
  let start = 1;
  let total = Infinity;
  while (rows.length < total && start <= MAX_ROWS) {
    const envelope = await fetchPage(serviceId, start, start + PAGE_SIZE - 1);
    if (envelope.RESULT?.CODE === "INFO-200") break;
    const page = envelope.row ?? [];
    total = Number(envelope.total_count ?? page.length) || page.length;
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
  }
  return rows;
}

// ---- 공공데이터포털(data.go.kr) 경유: 건강기능식품정보(품목) ----
// 식품안전나라가 해외 IP를 차단하므로, GitHub Actions에서는 이 경로가 품목 데이터의 주 수단.
const DGK_KEY = (env.DATA_GO_KR_SERVICE_KEY ?? "").trim();
const DGK_PRODUCT_ENDPOINT =
  (env.DGK_PRODUCT_ENDPOINT ?? "https://apis.data.go.kr/1471000/HtfsInfoService03/getHtfsItem01").trim();
const DGK_PAGE_SIZE = 100;

async function fetchProductsFromDataGoKr() {
  const rows = [];
  let pageNo = 1;
  let total = Infinity;
  while (rows.length < total && rows.length < MAX_ROWS) {
    const url = `${DGK_PRODUCT_ENDPOINT}?serviceKey=${encodeURIComponent(DGK_KEY)}&pageNo=${pageNo}&numOfRows=${DGK_PAGE_SIZE}&type=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} (${text.slice(0, 80).replace(/\s+/g, " ")})`);
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`비JSON 응답: ${text.slice(0, 80).replace(/\s+/g, " ")}`);
    }
    const header = json.header ?? json.response?.header ?? {};
    const code = header.resultCode ?? "?";
    if (code !== "00") throw new Error(`${code}: ${header.resultMsg ?? "API 오류"}`);
    const body = json.body ?? json.response?.body ?? {};
    let items = body.items ?? [];
    if (!Array.isArray(items)) items = items.item ?? [];
    const pageItems = items.map((entry) => entry?.item ?? entry).filter(Boolean);
    total = Number(body.totalCount ?? pageItems.length) || pageItems.length;
    rows.push(...pageItems);
    if (pageItems.length < DGK_PAGE_SIZE) break;
    pageNo++;
    await new Promise((r) => setTimeout(r, 120)); // 게이트웨이 부하 방지
  }
  // 사이트 내부 필드명(품목분류정보 스키마)으로 매핑
  return rows.map((item) => ({
    PRDCT_NM: item.PRDUCT ?? item.PRDCT_NM ?? "",
    BSSH_NM: item.ENTRPS ?? "",
    IFTKN_ATNT_MATR_CN: item.INTAKE_HINT1 ?? "",
    PRIMARY_FNCLTY: item.MAIN_FNCTN ?? "",
    DAY_INTK_LOWLIMIT: "",
    DAY_INTK_HIGHLIMIT: "",
    INTK_UNIT: "",
    INTK_MEMO: item.SRV_USE ?? "",
    SKLL_IX_IRDNT_RAWMTRL: item.RAWMTRL_NM ?? "",
    CRET_DTM: item.REGIST_DT ?? "",
    LAST_UPDT_DTM: item.REGIST_DT ?? "",
    STTEMNT_NO: item.STTEMNT_NO ?? "",
  }));
}

mkdirSync(OUT_DIR, { recursive: true });
let successCount = 0;
const saved = new Set();

function save(name, label, sourceLabel, rows) {
  writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify({ fetchedAt: new Date().toISOString(), rows }));
  console.log(`✓ ${label} (${sourceLabel}): ${rows.length}건 저장`);
  saved.add(name);
  successCount++;
}

// 1순위: 식품안전나라 (국내 실행 시 동작)
if (KEY) {
  for (const ds of DATASETS) {
    const serviceId = (env[ds.envVar] ?? "").trim();
    if (!serviceId) {
      console.warn(`△ ${ds.label}: ${ds.envVar} 미설정`);
      continue;
    }
    try {
      const rows = await fetchAllRows(serviceId);
      if (rows.length === 0) throw new Error("0건 반환");
      save(ds.name, ds.label, serviceId, rows);
    } catch (err) {
      console.warn(`✗ ${ds.label} (${serviceId}): ${err?.message ?? err}`);
    }
  }
} else {
  console.warn("△ FOODSAFETY_API_KEY 없음 — 식품안전나라 경로 건너뜀");
}

// 2순위: 품목 데이터는 data.go.kr 경유 (해외에서도 동작)
if (!saved.has("product") && DGK_KEY) {
  try {
    const rows = await fetchProductsFromDataGoKr();
    if (rows.length === 0) throw new Error("0건 반환");
    save("product", "품목분류정보", "data.go.kr", rows);
  } catch (err) {
    console.warn(`✗ 품목분류정보 (data.go.kr): ${err?.message ?? err}`);
  }
}

console.log(`\n${successCount}/${DATASETS.length} 데이터셋 수신 완료 (미수신 데이터셋은 커밋본 또는 샘플 데이터 사용)`);
