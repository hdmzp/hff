import { NextRequest, NextResponse } from "next/server";
import { buildMergedData, findItemById } from "@/lib/merge";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  const data = await buildMergedData();
  const detail = findItemById(data, id);
  if (!detail) return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ kind: id.startsWith("ing:") ? "원료" : "품목", detail });
}
