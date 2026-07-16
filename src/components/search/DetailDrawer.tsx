"use client";

import { useEffect, useState } from "react";
import CategoryChips from "@/components/shared/CategoryChips";
import type { IngredientDetail, ProductDetail } from "@/lib/types";

type Payload =
  | { kind: "원료"; detail: IngredientDetail }
  | { kind: "품목"; detail: ProductDetail };

function Row({ label, value }: { label: string; value?: string }) {
  if (!value || value === "-") return null;
  return (
    <div className="border-b border-hairline py-3 last:border-b-0">
      <p className="text-xs font-medium text-mute">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{value}</p>
    </div>
  );
}

export default function DetailDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  // id별 결과를 저장해, id가 바뀌면 자연스럽게 로딩 상태가 되도록 한다
  const [result, setResult] = useState<{ id: string; payload?: Payload; error?: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/item?id=${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "조회 실패");
        return res.json() as Promise<Payload>;
      })
      .then((json) => {
        if (!cancelled) setResult({ id, payload: json });
      })
      .catch((err) => {
        if (!cancelled) setResult({ id, error: err instanceof Error ? err.message : "조회 실패" });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return null;

  const payload = result?.id === id ? result.payload : undefined;
  const error = result?.id === id ? result.error : undefined;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto bg-canvas p-6 shadow-[0_4px_12px_rgba(0,0,0,0.16)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            {payload && (
              <>
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-on-primary">
                  {payload.kind}
                </span>
                <h2 className="display mt-3 text-2xl">{payload.detail.name}</h2>
              </>
            )}
            {!payload && !error && <p className="text-sm text-mute">불러오는 중…</p>}
            {error && <p className="text-sm text-warning">{error}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full border border-ash px-3 py-1 text-sm text-mute hover:bg-surface-soft"
          >
            닫기 ✕
          </button>
        </div>

        {payload?.kind === "원료" && (
          <div className="mt-6">
            <CategoryChips categories={payload.detail.categories} />
            <div className="mt-4">
              <Row label="인정번호" value={payload.detail.approvalNo} />
              <Row label="인정일자" value={payload.detail.dateLabel} />
              <Row label="업체명" value={payload.detail.company} />
              <Row label="업종" value={payload.detail.industry} />
              <Row label="주소" value={payload.detail.address} />
              <Row label="기능성 내용" value={payload.detail.functionality} />
              <Row label="1일 섭취량" value={payload.detail.dailyIntake} />
              <Row label="섭취 시 주의사항" value={payload.detail.caution} />
            </div>
            {payload.detail.individual && (
              <div className="mt-6 rounded-lg bg-surface-card p-4">
                <p className="text-sm font-semibold">개별인정형 정보</p>
                <Row label="원재료명" value={payload.detail.individual.rawMaterial} />
                <Row
                  label="1일 섭취량 범위"
                  value={`${payload.detail.individual.intakeLow} ~ ${payload.detail.individual.intakeHigh} ${payload.detail.individual.unit}`}
                />
                <Row label="주된 기능성" value={payload.detail.individual.primaryFunctionality} />
                <Row label="주의사항" value={payload.detail.individual.caution} />
              </div>
            )}
            {payload.detail.relatedProducts.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold">
                  관련 품목 <span className="font-normal text-mute">(원료명 기반 추정)</span>
                </p>
                <ul className="mt-2 list-inside list-disc text-sm leading-relaxed text-body">
                  {payload.detail.relatedProducts.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {payload?.kind === "품목" && (
          <div className="mt-6">
            <CategoryChips categories={payload.detail.categories} />
            <div className="mt-4">
              <Row label="주된 기능성" value={payload.detail.functionality} />
              <Row label="성분명" value={payload.detail.ingredients} />
              <Row
                label="일일 섭취량"
                value={
                  payload.detail.intakeLow !== "-"
                    ? `${payload.detail.intakeLow} ~ ${payload.detail.intakeHigh} ${payload.detail.unit}`
                    : undefined
                }
              />
              <Row label="섭취 방법" value={payload.detail.memo} />
              <Row label="섭취 시 주의사항" value={payload.detail.caution} />
              <Row label="최초 등록일" value={payload.detail.createdLabel} />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
