#!/usr/bin/env node
// 공공데이터포털(data.go.kr) 쪽 건강기능식품 API 엔드포인트 탐색 스크립트.
// GitHub Actions(해외 IP)에서 실행해 접근 가능 여부를 확인하는 용도.
//
// 1) 각 데이터셋의 data.go.kr 문서 페이지에서 엔드포인트 URL을 추출
// 2) DATA_GO_KR_SERVICE_KEY 가 있으면 실제 호출까지 시험

const PAGES = [
  { id: "15058359", label: "기능성 원료인정 현황" },
  { id: "15074311", label: "개별인정형 정보" },
  { id: "15056760", label: "건강기능식품정보(품목)" },
  { id: "15085712", label: "영양DB" },
];

const KEY = (process.env.DATA_GO_KR_SERVICE_KEY ?? "").trim();
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const found = {};

for (const page of PAGES) {
  const url = `https://www.data.go.kr/data/${page.id}/openapi.do`;
  console.log(`\n===== ${page.label} (${page.id}) =====`);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
    console.log(`문서 페이지: HTTP ${res.status}`);
    const html = await res.text();

    // 엔드포인트/요청주소 후보 추출
    const urls = [
      ...new Set(
        (html.match(/https?:\/\/[A-Za-z0-9./_:%-]*(?:apis\.data\.go\.kr|openapi\.foodsafetykorea\.go\.kr|data\.mfds\.go\.kr)[A-Za-z0-9./_:%?=&-]*/g) ?? []),
      ),
    ];
    console.log("발견된 URL:", urls.length ? urls.slice(0, 10) : "(없음)");

    // "End Point" 표기 주변 텍스트
    const epIdx = html.search(/End\s*Point|엔드포인트|요청주소/i);
    if (epIdx >= 0) {
      const snippet = html
        .slice(epIdx, epIdx + 600)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      console.log("End Point 주변:", snippet.slice(0, 300));
    }

    // 스웨거/상세기능 관련 흔적 (JS 렌더링 페이지 대응)
    for (const pattern of [/oas\/docs[^"'\s<>]*/g, /infuser[^"'\s<>]*/g, /swagger[^"'\s<>]{0,80}/gi, /operationUrl[^,}\n]{0,120}/g, /publicDataDetailPk[^,}\n]{0,80}/g]) {
      const hits = [...new Set(html.match(pattern) ?? [])].slice(0, 5);
      if (hits.length) console.log(`  힌트(${pattern.source.slice(0, 12)}…):`, hits);
    }
    found[page.id] = urls;
  } catch (err) {
    console.log(`✗ 문서 페이지 접근 실패: ${err?.message ?? err}`);
  }
}

// 키 없이도 각 게이트웨이의 해외 접근 가능 여부 확인 (키 오류 응답 = 접근 가능)
console.log("\n===== 게이트웨이 접근성 시험 (키 미포함) =====");
const REACHABILITY = [
  "https://apis.data.go.kr/1471000/HtfsInfoService03/getHtfsItem01?serviceKey=test&type=json&pageNo=1&numOfRows=1",
  "http://data.mfds.go.kr/openapi/HtfsInfoService/getHtfsItem?ServiceKey=test&pageNo=1&numOfRows=1",
  "https://data.mfds.go.kr/",
];
for (const url of REACHABILITY) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25_000) });
    const text = await res.text();
    console.log(`${url.split("?")[0]}\n  → HTTP ${res.status} · 앞 150자: ${text.slice(0, 150).replace(/\s+/g, " ")}`);
  } catch (err) {
    console.log(`${url.split("?")[0]}\n  → ✗ ${err?.message ?? err}`);
  }
}

// serviceKey 가 있으면 apis.data.go.kr 엔드포인트 실호출 시험
if (KEY) {
  console.log("\n===== apis.data.go.kr 실호출 시험 =====");
  const candidates = new Set();
  for (const urls of Object.values(found)) {
    for (const u of urls) if (u.includes("apis.data.go.kr")) candidates.add(u.split("?")[0]);
  }
  // 알려진 후보 추가
  candidates.add("https://apis.data.go.kr/1471000/HtfsInfoService03/getHtfsItem01");

  for (const base of candidates) {
    try {
      const url = `${base}?serviceKey=${encodeURIComponent(KEY)}&pageNo=1&numOfRows=2&type=json`;
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
      const text = await res.text();
      let summary;
      try {
        const json = JSON.parse(text);
        const item =
          json?.body?.items?.[0]?.item ?? json?.body?.items?.[0] ?? json?.response?.body?.items?.item?.[0];
        summary = `JSON OK · totalCount=${json?.body?.totalCount ?? json?.response?.body?.totalCount ?? "?"} · 필드=${item ? Object.keys(item).slice(0, 12).join(",") : "(item 없음)"}`;
      } catch {
        summary = `비JSON 응답 (앞 120자): ${text.slice(0, 120).replace(/\s+/g, " ")}`;
      }
      console.log(`${base}\n  → HTTP ${res.status} · ${summary}`);
    } catch (err) {
      console.log(`${base}\n  → ✗ ${err?.message ?? err}`);
    }
  }
} else {
  console.log("\n(DATA_GO_KR_SERVICE_KEY 미설정 — 엔드포인트 추출만 수행)");
}
