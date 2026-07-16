# 건기식 인사이트 (careworker)

유통업계를 위한 **건강기능식품 산업 동향 대시보드**입니다.
식품의약품안전처 식품안전나라 OPEN API 4종(기능성 원료인정 현황 / 개별인정형 정보 / 품목분류정보 / 영양DB)을 활용합니다.

**정적 사이트**로 빌드되어 GitHub Pages에서 서비스되며, GitHub Actions가 **매일 05:00(KST) 데이터를 자동 갱신**해 재배포합니다.

## 화면 구성

| 탭 | 내용 |
|---|---|
| **대시보드** | 연도별 원료 인정 추이, 기능성 카테고리 TOP 10, 업체 TOP 10, 최근 인정 원료, 요약 통계 |
| **원료·품목 검색** | 원료+품목 통합 검색, 기능성/연도/업종 필터, 상세 보기(섭취량·주의사항·개별인정형 병합), CSV 다운로드 |
| **업체 분석** | 업체별 인정 건수 랭킹, 지역별 분포, 업체별 보유 원료 목록 |
| **기능성 분류 탐색** | 영양DB 대→중→소분류 트리, 분류별 관련 원료·품목 |

기술 스택: Next.js (App Router, TypeScript, 정적 내보내기) · Tailwind CSS v4 · recharts

## 로컬에서 실행

```bash
npm install
npm run dev    # http://localhost:3000 — 샘플 데이터로 바로 동작
```

실데이터로 보려면:

```bash
cp .env.example .env.local          # FOODSAFETY_API_KEY 입력
node scripts/test-api.mjs           # 인증키 검증 + serviceId 자동 탐색 → .env.local 에 반영
node scripts/fetch-data.mjs         # data/live/*.json 으로 데이터 다운로드
npm run dev                         # 배지가 "식약처 데이터"로 바뀜
```

## GitHub Pages 배포 (최초 1회 설정)

1. **Settings → Secrets and variables → Actions → Secrets** 에 추가:
   - `FOODSAFETY_API_KEY` = 발급받은 인증키
2. (선택) 같은 화면 **Variables** 에 serviceId 추가 — `scripts/test-api.mjs` 로 찾은 값:
   - `FSK_SERVICE_INDIVIDUAL`, `FSK_SERVICE_PRODUCT`, `FSK_SERVICE_NUTRITION`
   - (`FSK_SERVICE_INGREDIENT` 는 기본값 I2820 사용)
3. `main` 브랜치에 푸시하면 자동 배포 → `https://<계정>.github.io/<저장소이름>/`
   (Pages 활성화는 워크플로가 자동 처리)

이후에는 매일 새벽 자동으로 데이터를 받아 재배포하고, **Actions 탭 → "Deploy to GitHub Pages" → Run workflow** 로 수동 갱신도 가능합니다.

## 데이터 동작 방식

- 빌드 시점에 `scripts/fetch-data.mjs` 가 API 전체 데이터를 `data/live/*.json` 으로 저장하고, 사이트는 이를 정적 HTML로 굽습니다 — **인증키는 GitHub Secrets에만 존재하고 사이트에 노출되지 않습니다**
- 데이터를 받지 못한 데이터셋은 내장 샘플 데이터로 대체됩니다 (화면에 "샘플 데이터" 배지 표시)
- 기능성 카테고리는 `src/lib/categories.ts` 의 키워드 규칙으로 자동 분류합니다 —
  실데이터에서 "기타" 비중이 높으면 이 파일에 키워드를 추가해 튜닝하세요
- 원료↔품목 연결은 공유 키가 없어 원료명 텍스트 매칭 기반의 **추정치**입니다

## 참고

- 데이터 출처: 식품의약품안전처 식품안전나라 (openapi.foodsafetykorea.go.kr)
- 자동 분류·연결 결과는 공식 통계와 다를 수 있습니다
