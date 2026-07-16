import { getConfig } from "./config";

const PAGE_SIZE = 1000;
const MAX_ROWS = 20_000;
const REQUEST_TIMEOUT_MS = 15_000;

interface ApiEnvelope {
  total_count?: string;
  row?: Record<string, string>[];
  RESULT?: { CODE?: string; MSG?: string };
}

export class FoodSafetyApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "FoodSafetyApiError";
  }
}

async function fetchPage(serviceId: string, start: number, end: number): Promise<ApiEnvelope> {
  const { apiKey, baseUrl } = getConfig();
  if (!apiKey) throw new FoodSafetyApiError("NO-KEY", "FOODSAFETY_API_KEY가 설정되지 않았습니다.");
  const url = `${baseUrl}/${apiKey}/${serviceId}/json/${start}/${end}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new FoodSafetyApiError(`HTTP-${res.status}`, `API HTTP 오류 (${res.status})`);
  const json = (await res.json()) as Record<string, ApiEnvelope>;
  const envelope = json[serviceId];
  if (!envelope) {
    // 잘못된 serviceId 등은 최상위 RESULT로 내려올 수 있음
    const topResult = (json as { RESULT?: { CODE?: string; MSG?: string } }).RESULT;
    throw new FoodSafetyApiError(topResult?.CODE ?? "NO-ENVELOPE", topResult?.MSG ?? "응답에 데이터가 없습니다.");
  }
  const code = envelope.RESULT?.CODE ?? "";
  if (code !== "INFO-000" && code !== "INFO-200") {
    throw new FoodSafetyApiError(code || "UNKNOWN", envelope.RESULT?.MSG ?? "API 오류");
  }
  return envelope;
}

/** serviceId의 전체 row를 1000건 단위로 페이징해 모두 가져온다. */
export async function fetchAllRows(serviceId: string): Promise<Record<string, string>[]> {
  const rows: Record<string, string>[] = [];
  let start = 1;
  let total = Infinity;
  while (rows.length < total && start <= MAX_ROWS) {
    const envelope = await fetchPage(serviceId, start, start + PAGE_SIZE - 1);
    if (envelope.RESULT?.CODE === "INFO-200") break; // 해당 범위에 데이터 없음
    const page = envelope.row ?? [];
    total = Number(envelope.total_count ?? page.length) || page.length;
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
  }
  console.log(`[foodsafety] ${serviceId}: ${rows.length}건 수신`);
  return rows;
}
