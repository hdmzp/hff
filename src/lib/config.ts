import type { DatasetName } from "./types";

export interface AppConfig {
  apiKey: string;
  baseUrl: string;
  serviceIds: Record<DatasetName, string>;
  cacheTtlMs: number;
  useMockData: boolean;
}

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function getConfig(): AppConfig {
  const ttlHours = Number(env("CACHE_TTL_HOURS") || "24");
  return {
    apiKey: env("FOODSAFETY_API_KEY"),
    baseUrl: env("FOODSAFETY_BASE_URL") || "http://openapi.foodsafetykorea.go.kr/api",
    serviceIds: {
      ingredient: env("FSK_SERVICE_INGREDIENT"),
      individual: env("FSK_SERVICE_INDIVIDUAL"),
      product: env("FSK_SERVICE_PRODUCT"),
      nutrition: env("FSK_SERVICE_NUTRITION"),
    },
    cacheTtlMs: (Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours : 24) * 3600_000,
    useMockData: env("USE_MOCK_DATA") === "1",
  };
}

export const DATASET_LABELS: Record<DatasetName, string> = {
  ingredient: "기능성 원료인정 현황",
  individual: "개별인정형 정보",
  product: "품목분류정보",
  nutrition: "영양DB",
};
