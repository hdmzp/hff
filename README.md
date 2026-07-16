# 건기식 인사이트 (careworker)

유통업계를 위한 **건강기능식품 산업 동향 대시보드**입니다.
식품의약품안전처 식품안전나라 OPEN API 4종(기능성 원료인정 현황 / 개별인정형 정보 / 품목분류정보 / 영양DB)을 활용합니다.

## 화면 구성

| 탭 | 내용 |
|---|---|
| **대시보드** | 연도별 원료 인정 추이, 기능성 카테고리 TOP 10, 업체 TOP 10, 최근 인정 원료, 요약 통계 |
| **원료·품목 검색** | 원료+품목 통합 검색, 기능성/연도/업종 필터, 상세 보기(섭취량·주의사항·개별인정형 병합), CSV 다운로드 |
| **업체 분석** | 업체별 인정 건수 랭킹, 지역별 분포, 업체별 보유 원료 목록 |
| **기능성 분류 탐색** | 영양DB 대→중→소분류 트리, 분류별 관련 원료·품목 |

기술 스택: Next.js (App Router, TypeScript) · Tailwind CSS v4 · recharts

## 시작하기

```bash
npm install
cp .env.example .env.local   # 그리고 FOODSAFETY_API_KEY 에 인증키 입력
npm run dev                  # http://localhost:3000
```

인증키가 없거나 serviceId가 비어 있으면 **자동으로 내장 샘플 데이터로 동작**하므로,
API 설정 없이도 바로 화면을 확인할 수 있습니다 (페이지 우측 상단에 "샘플 데이터" 배지 표시).

## 실제 API 연결

1. 인증키 확인 및 serviceId 자동 탐색:

   ```bash
   node scripts/test-api.mjs
   # 특정 후보를 직접 시험하려면: node scripts/test-api.mjs I0030 C003
   ```

   스크립트가 각 데이터셋의 필드 시그니처와 대조해 일치하는 serviceId를 찾아
   `.env.local` 에 넣을 값을 알려줍니다.

2. `.env.local` 에 결과 반영:

   ```
   FOODSAFETY_API_KEY=발급받은키
   FSK_SERVICE_INGREDIENT=I2820
   FSK_SERVICE_INDIVIDUAL=...
   FSK_SERVICE_PRODUCT=...
   FSK_SERVICE_NUTRITION=...
   ```

3. `npm run dev` 재시작 → 배지가 "실시간 데이터"로 바뀌고 `.data/` 폴더에 캐시 파일이 생성됩니다.

## 데이터 동작 방식

- **3단계 폴백**: 실시간 API → 파일 캐시(`.data/*.json`, 기본 24시간 TTL) → 내장 샘플 데이터
- API 호출은 전부 서버 사이드에서 실행되어 **인증키가 브라우저에 노출되지 않습니다**
- 대시보드의 "데이터 새로고침" 버튼(또는 `POST /api/refresh`)으로 캐시를 강제 갱신할 수 있습니다
- 기능성 카테고리는 `src/lib/categories.ts` 의 키워드 규칙으로 자동 분류합니다 —
  실데이터에서 "기타" 비중이 높으면 이 파일에 키워드를 추가해 튜닝하세요
- 원료↔품목 연결은 공유 키가 없어 원료명 텍스트 매칭 기반의 **추정치**입니다

## 참고

- 데이터 출처: 식품의약품안전처 식품안전나라 (openapi.foodsafetykorea.go.kr)
- 자동 분류·연결 결과는 공식 통계와 다를 수 있습니다
