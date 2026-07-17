#!/usr/bin/env node
// 식품안전나라 OPEN API 인증키 검증 + serviceId 탐색 스크립트
//
// 사용법 (로컬 PC에서 실행):
//   node scripts/test-api.mjs                  # 기본 후보 serviceId들을 시험
//   node scripts/test-api.mjs I0030 C003 ...   # 직접 후보를 추가로 지정
//
// .env.local 의 FOODSAFETY_API_KEY 를 읽어 사용합니다. (키는 화면에 출력하지 않습니다)

import { readFileSync } from "node:fs";
import path from "node:path";

// ---- .env.local 간이 파서 (의존성 없음) ----
function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local 없으면 process.env만 사용
  }
  return env;
}

const env = loadEnv();
const KEY = (env.FOODSAFETY_API_KEY ?? "").trim();
const BASE = (env.FOODSAFETY_BASE_URL ?? "http://openapi.foodsafetykorea.go.kr/api").trim();

if (!KEY) {
  console.error("✗ FOODSAFETY_API_KEY 가 없습니다. .env.local 에 키를 입력하세요.");
  process.exit(1);
}

// 각 데이터셋을 식별하는 필드 시그니처
const DATASETS = [
  {
    envVar: "FSK_SERVICE_INGREDIENT",
    label: "기능성 원료인정 현황",
    signature: ["HF_FNCLTY_MTRAL_RCOGN_NO", "PRMS_DT", "APLC_RAWMTRL_NM", "FNCLTY_CN"],
  },
  {
    envVar: "FSK_SERVICE_INDIVIDUAL",
    label: "개별인정형 정보",
    signature: ["HF_FNCLTY_MTRAL_RCOGN_NO", "DAY_INTK_HIGHLIMIT", "RAWMTRL_NM", "PRIMARY_FNCLTY"],
  },
  {
    envVar: "FSK_SERVICE_PRODUCT",
    label: "품목분류정보",
    signature: ["PRDCT_NM", "SKLL_IX_IRDNT_RAWMTRL", "PRIMARY_FNCLTY", "CRET_DTM"],
  },
  {
    envVar: "FSK_SERVICE_NUTRITION",
    label: "영양DB",
    signature: ["HELT_ITM_GRP_CD", "LCLAS_NM", "MLSFC_NM", "SCLAS_NM"],
  },
];

// 기본 후보 serviceId (식약처 공개 서비스 코드 관례 기반) + CLI 인자 추가
const DEFAULT_CANDIDATES = [
  "I2820", "I0020", "I0030", "I0040", "I2810", "I2830", "I2840", "I2850", "I2860", "I2870",
  "C002", "C003", "I1250", "I2790",
];
const candidates = [...new Set([...DEFAULT_CANDIDATES, ...process.argv.slice(2)])];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

async function probe(serviceId) {
  const url = `${BASE}/${KEY}/${serviceId}/json/1/3`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { serviceId, code: `HTTP-${res.status}` };
    const json = await res.json();
    const envelope = json[serviceId] ?? json;
    const code = envelope?.RESULT?.CODE ?? json?.RESULT?.CODE ?? "?";
    const msg = envelope?.RESULT?.MSG ?? json?.RESULT?.MSG ?? "";
    const row = envelope?.row?.[0];
    return {
      serviceId,
      code,
      msg,
      totalCount: envelope?.total_count,
      fields: row ? Object.keys(row) : [],
    };
  } catch (err) {
    return { serviceId, code: "NETWORK", msg: err?.message ?? String(err) };
  }
}

function matchDataset(fields) {
  let best = null;
  for (const ds of DATASETS) {
    const hits = ds.signature.filter((f) => fields.includes(f)).length;
    const score = hits / ds.signature.length;
    if (score >= 0.75 && (!best || score > best.score)) best = { ...ds, score };
  }
  return best;
}

console.log("식품안전나라 OPEN API 점검 시작");
console.log(`  베이스 URL: ${BASE}`);
console.log(`  후보 serviceId ${candidates.length}개 시험\n`);

const found = {};
let keyValid = false;

for (const serviceId of candidates) {
  const result = await probe(serviceId);
  if (result.code === "NETWORK") {
    console.log(`  ${serviceId}: ✗ 네트워크 오류 (${result.msg})`);
    await sleep(300);
    continue;
  }
  if (result.code === "INFO-000" || result.code === "INFO-200") keyValid = true;

  const matched = result.fields.length > 0 ? matchDataset(result.fields) : null;
  if (matched) {
    console.log(`  ${serviceId}: ✓ ${result.code} · total ${result.totalCount} → 「${matched.label}」 일치!`);
    if (!found[matched.envVar]) found[matched.envVar] = serviceId;
  } else if (result.code === "INFO-000") {
    console.log(`  ${serviceId}: ○ ${result.code} · total ${result.totalCount} · 필드: ${result.fields.slice(0, 5).join(", ")}…`);
  } else {
    console.log(`  ${serviceId}: ✗ ${result.code} ${result.msg ? `(${result.msg})` : ""}`);
  }
  await sleep(300);
}

console.log("\n──────── 결과 ────────");
if (keyValid) {
  console.log("✓ 인증키가 유효합니다.");
} else {
  console.log("✗ 어떤 serviceId에서도 정상 응답을 받지 못했습니다. 인증키 또는 네트워크를 확인하세요.");
  console.log("  (INFO-300 계열이면 키 문제, NETWORK면 방화벽/프록시 문제일 가능성이 큽니다)");
}

const lines = [];
for (const ds of DATASETS) {
  if (found[ds.envVar]) {
    lines.push(`${ds.envVar}=${found[ds.envVar]}`);
  } else {
    console.log(`△ 「${ds.label}」의 serviceId를 찾지 못했습니다. 식품안전나라 OpenAPI 페이지에서 코드를 확인 후 인자로 넘겨 재시도하세요.`);
  }
}
if (lines.length > 0) {
  console.log("\n.env.local 에 다음을 설정하세요:\n");
  console.log(lines.join("\n"));
}
