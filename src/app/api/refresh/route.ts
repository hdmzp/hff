import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { refreshDataset } from "@/lib/datasets";
import type { DatasetName } from "@/lib/types";
import { DATASET_LABELS } from "@/lib/config";

export const dynamic = "force-dynamic";

const ALL: DatasetName[] = ["ingredient", "individual", "product", "nutrition"];

export async function POST(req: Request) {
  const url = new URL(req.url);
  const only = url.searchParams.get("dataset") as DatasetName | null;
  const targets = only && ALL.includes(only) ? [only] : ALL;

  const results: Record<string, { source: string; rowCount: number; error?: string }> = {};
  for (const name of targets) {
    try {
      results[DATASET_LABELS[name]] = await refreshDataset(name);
    } catch (err) {
      results[DATASET_LABELS[name]] = {
        source: "error",
        rowCount: 0,
        error: err instanceof Error ? err.message : "알 수 없는 오류",
      };
    }
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ results });
}
