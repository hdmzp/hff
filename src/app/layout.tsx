import type { Metadata } from "next";
import Link from "next/link";
import NavTabs from "@/components/layout/NavTabs";
import "./globals.css";

export const metadata: Metadata = {
  title: "건기식 인사이트 — 건강기능식품 산업 동향",
  description:
    "식품안전나라 OPEN API 기반 건강기능식품 기능성 원료 인정 현황·품목·업체 동향 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* primary-nav: 검정 바탕, 흰 텍스트 */}
        <header className="sticky top-0 z-40 bg-canvas-dark">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
            <Link href="/" className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="text-lg font-semibold tracking-tight text-on-dark">건기식 인사이트</span>
              <span className="hidden text-xs text-mute-dark sm:inline">HF Industry Trends</span>
            </Link>
            <NavTabs />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* footer-section: 브랜드 블루 밴드 */}
        <footer className="bg-primary text-on-primary">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <p className="display text-2xl">건기식 인사이트</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-80">
              본 서비스는 식품의약품안전처 식품안전나라 공공데이터(OPEN API)를 활용합니다. 기능성
              카테고리 분류와 원료-품목 연결은 자동 분석에 의한 추정치로, 공식 통계와 다를 수
              있습니다.
            </p>
            <p className="mt-6 text-xs opacity-60">
              데이터 출처: 식품의약품안전처 · 식품안전나라 openapi.foodsafetykorea.go.kr
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
