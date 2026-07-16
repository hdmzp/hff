/** 날짜 문자열(YYYYMMDD / YYYY-MM-DD / YYYY.MM.DD 등)에서 연도 추출. 실패 시 null */
export function parseYear(raw?: string): number | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 4) return null;
  const y = Number(digits.slice(0, 4));
  return y >= 1990 && y <= 2100 ? y : null;
}

/** 표시용 날짜: 파싱 가능하면 YYYY-MM-DD, 아니면 원문 그대로 */
export function formatDate(raw?: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length >= 8) {
    const y = digits.slice(0, 4);
    const m = digits.slice(4, 6);
    const d = digits.slice(6, 8);
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }
  return raw?.trim() || "-";
}

const REGION_MAP: [pattern: string, region: string][] = [
  ["서울", "서울"],
  ["부산", "부산"],
  ["대구", "대구"],
  ["인천", "인천"],
  ["광주", "광주"],
  ["대전", "대전"],
  ["울산", "울산"],
  ["세종", "세종"],
  ["경기", "경기"],
  ["강원", "강원"],
  ["충청북", "충북"],
  ["충북", "충북"],
  ["충청남", "충남"],
  ["충남", "충남"],
  ["전라북", "전북"],
  ["전북", "전북"],
  ["전라남", "전남"],
  ["전남", "전남"],
  ["경상북", "경북"],
  ["경북", "경북"],
  ["경상남", "경남"],
  ["경남", "경남"],
  ["제주", "제주"],
];

/** 주소 → 시도. 국내 시도가 아니면 "해외/기타" */
export function extractRegion(addr?: string): string {
  const first = (addr ?? "").trim().split(/\s+/)[0] ?? "";
  for (const [pattern, region] of REGION_MAP) {
    if (first.startsWith(pattern)) return region;
  }
  return "해외/기타";
}

/** 업체명 그룹핑 키: (주)/㈜/주식회사/(유) 및 공백 제거 */
export function companyKey(name?: string): string {
  return (name ?? "")
    .replace(/\(주\)|㈜|주식회사|\(유\)|\(재\)|농업회사법인|유한회사/g, "")
    .replace(/\s+/g, "")
    .trim();
}
