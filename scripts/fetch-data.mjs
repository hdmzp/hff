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
  // http 실패 시 https 로도 재시도
  const bases = BASE.startsWith("http://") ? [BASE, BASE.replace("http://", "https://")] : [BASE];
  let lastErr;
  let text = "";
  for (const base of bases) {
    try {
      const url = `${base}/${KEY}/${serviceId}/json/${start}/${end}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
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

if (!KEY) {
  console.warn("△ FOODSAFETY_API_KEY 없음 — 전체 데이터셋을 샘플 데이터로 빌드합니다.");
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });
let successCount = 0;

for (const ds of DATASETS) {
  const serviceId = (env[ds.envVar] ?? "").trim();
  if (!serviceId) {
    console.warn(`△ ${ds.label}: ${ds.envVar} 미설정 — 샘플 데이터 사용`);
    continue;
  }
  try {
    const rows = await fetchAllRows(serviceId);
    if (rows.length === 0) throw new Error("0건 반환");
    writeFileSync(
      path.join(OUT_DIR, `${ds.name}.json`),
      JSON.stringify({ fetchedAt: new Date().toISOString(), rows }),
    );
    console.log(`✓ ${ds.label} (${serviceId}): ${rows.length}건 저장`);
    successCount++;
  } catch (err) {
    console.warn(`✗ ${ds.label} (${serviceId}): ${err?.message ?? err} — 샘플 데이터 사용`);
  }
}

console.log(`\n${successCount}/${DATASETS.length} 데이터셋 수신 완료`);
