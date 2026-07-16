import { buildMergedData } from "@/lib/merge";

export const dynamic = "force-static";

// 정적 내보내기 시 빌드 시점에 한 번 실행되어 /details.json 파일로 출력된다.
// 검색 상세 드로어가 이 파일을 지연 로드해 id로 조회한다.
export async function GET() {
  const data = await buildMergedData();
  const map: Record<string, unknown> = {};
  data.ingredients.forEach((d, i) => {
    map[`ing:${d.approvalNo || i}`] = { kind: "원료", detail: d };
  });
  data.products.forEach((d, i) => {
    map[`prd:${i}`] = { kind: "품목", detail: d };
  });
  return Response.json(map);
}
