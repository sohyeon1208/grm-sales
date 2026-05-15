# Gooroomee Sales — 개발자 인수인계 문서

> 최초 작성일: 2026년 5월  
> 최종 업데이트: 2026년 5월 15일  
> 작성 목적: 담당자 교체 시 신규 개발자가 이 문서만으로 유지보수·기능 추가를 할 수 있도록 작성

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [로컬 개발 환경 세팅](#3-로컬-개발-환경-세팅)
4. [환경변수 (.env.local)](#4-환경변수-envlocal)
5. [Google Sheets 데이터 구조](#5-google-sheets-데이터-구조)
6. [전체 파일 구조](#6-전체-파일-구조)
7. [주요 기능 설명](#7-주요-기능-설명)
8. [API 라우트 목록](#8-api-라우트-목록)
9. [인증 (Google OAuth)](#9-인증-google-oauth)
10. [배포 (Vercel + GitHub)](#10-배포-vercel--github)
11. [외부 서비스 계정 정보](#11-외부-서비스-계정-정보)
12. [향후 개발 시 주의사항](#12-향후-개발-시-주의사항)

---

## 1. 프로젝트 개요

**Gooroomee Sales**는 구루미 영업팀이 사용하는 내부 CRM 웹 서비스입니다.

| 항목 | 내용 |
|------|------|
| 서비스명 | Gooroomee Sales |
| 접속 URL | https://grm-sales.vercel.app (또는 Vercel 배포 도메인) |
| 접근 제한 | `@gooroomee.com` Google 계정만 로그인 가능 |
| 데이터 저장소 | Google Sheets (별도 DB 없음) |
| 주 사용자 | 구루미 영업팀 |

### 제공 기능 요약

- **매출 대시보드**: 월별 매출, 채널별 분포, KPI 카드, 다크/라이트 테마 지원
- **계약 관리**: 고객사 칸반 보드, D-Day 표시, 계약 만료 필터, 전역 검색
- **고객 상세**: 계약정보·정산정보·히스토리 타임라인, 고객정보 수정·삭제
- **히스토리**: 추가·수정·삭제, 작성자 자동 기록
- **정산 캘린더**: 월별 정산 대상 고객 카드, 템플릿 복사 버튼
- **전역 검색**: 상단 검색바 Enter → 고객사 검색 결과 페이지(`/customers?q=`)

---

## 2. 기술 스택

| 분류 | 라이브러리 / 버전 |
|------|------------------|
| 프레임워크 | **Next.js 16.2.6** (App Router) |
| UI 언어 | **React 19**, TypeScript 5 |
| 스타일 | **Tailwind CSS 4** (인라인 style 병행) |
| 인증 | **NextAuth v5** (beta, Google OAuth 2.0) |
| 데이터 | **googleapis 171** (Google Sheets API v4) |
| 차트 | **Recharts 3** |
| 배포 | **Vercel** (GitHub 자동 배포) |
| 폰트 | Pretendard (CDN) |

> ⚠️ **Next.js 16은 파격적 변경이 많습니다.** `params`, `searchParams`가 모두 `Promise`로 바뀌었고, 여러 API가 변경되었습니다. 기존 Next.js 13~15 문서를 그대로 참고하면 오류가 납니다.

---

## 3. 로컬 개발 환경 세팅

### 필수 조건
- Node.js 20 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/sohyeon1208/grm-sales.git
cd grm-sales

# 2. 패키지 설치
npm install

# 3. 환경변수 파일 생성 (아래 섹션 참고)
# .env.local 파일을 직접 만들어야 합니다 (gitignore 대상)

# 4. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

### Git 리모트 구조

```
origin    → https://github.com/sohyeon1208/gooroomee.git  (읽기 전용 참고용)
grm_test  → https://github.com/sohyeon1208/grm_test.git   (테스트 배포용)
grm_sales → https://github.com/sohyeon1208/grm-sales.git  (프로덕션 배포용) ★ 메인
```

> **배포할 때는 `git push grm_sales main`으로 push합니다.**  
> Vercel이 GitHub 변경을 자동 감지해 빌드·배포를 시작합니다.

---

## 4. 환경변수 (.env.local)

프로젝트 루트에 `.env.local` 파일을 생성해야 합니다. 이 파일은 `.gitignore`에 등록되어 있어 **절대 GitHub에 올라가지 않습니다.**

```env
# ── Google Sheets ──────────────────────────────────────
GOOGLE_SHEET_ID=1H9PoToEebAvsqZx9pjxx1q3Wl6cpWjaX6IfTQ3qqJ5g
GOOGLE_SERVICE_ACCOUNT_EMAIL=soheyon1@crypto-resolver-496201-k4.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n(키 내용)\n-----END PRIVATE KEY-----\n"

# ── Google OAuth (NextAuth) ────────────────────────────
AUTH_GOOGLE_ID=876779310220-8c3u3...apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-...
AUTH_SECRET=랜덤문자열(32자 이상)
```

### 각 값을 얻는 방법

| 변수 | 위치 |
|------|------|
| `GOOGLE_SHEET_ID` | Google Sheets URL에서 `/d/` 뒤 문자열 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Cloud Console → IAM → 서비스 계정 |
| `GOOGLE_PRIVATE_KEY` | 서비스 계정 → 키 → JSON 다운로드 → `private_key` 필드 |
| `AUTH_GOOGLE_ID` | Google Cloud Console → 사용자 인증 정보 → OAuth 클라이언트 ID |
| `AUTH_GOOGLE_SECRET` | 위와 동일 |
| `AUTH_SECRET` | 터미널에서 `openssl rand -base64 32` 실행 |

### Vercel에 환경변수 등록

Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables**에 위 변수들을 모두 등록해야 합니다.  
`GOOGLE_PRIVATE_KEY`는 `"` 따옴표 없이 키 값만 붙여넣으세요.

---

## 5. Google Sheets 데이터 구조

데이터베이스 역할을 하는 Google Sheets의 구조입니다.  
**Sheet ID**: `1H9PoToEebAvsqZx9pjxx1q3Wl6cpWjaX6IfTQ3qqJ5g`

### 탭 구조

| 탭 이름 | 용도 | 코드 상수 |
|---------|------|-----------|
| `👥 고객사 마스터` | 고객 전체 목록 | `CUSTOMERS_SHEET_NAME` |
| `히스토리 전체` | 기존 히스토리 아카이브 | `HISTORY_ARCHIVE_SHEET` |
| `히스토리 입력` | 사이트에서 새로 추가한 히스토리 | `HISTORY_INPUT_SHEET` |

> 탭 이름이 코드와 정확히 일치해야 합니다. 탭 이름을 바꾸면 `src/lib/customers.ts`와 `src/lib/history.ts`의 상수도 함께 변경해야 합니다.

### 고객사 마스터 탭 컬럼 구조 (A~S열)

| 열 | 필드명 | 코드 필드 |
|----|--------|-----------|
| A | 그룹명 | `그룹명` |
| B | 영업활동명 | `영업활동명` ← **주 식별자** |
| C | 그룹 ID | `그룹ID` |
| D | 영업 단계 | `영업단계` |
| E | 최근 활동일 | `최근활동일` |
| F | 그룹유형 | `그룹유형` |
| G | 정산주기 | `정산주기` |
| H | 정산일 | `정산일` |
| I | 요금 | `요금` |
| J | 청구방법 | `청구방법` |
| K | 계약 비고 | `계약비고` |
| L | 정산 담당자/수신처 | `정산담당자` |
| M | 정산방법 | `정산방법` |
| N | 계약항목(이용서비스) | `계약항목` |
| O | 세금계산서 고객사명 | `세금계산서고객사명` |
| P | 계약 만료일 | `계약만료일` |
| Q | 라이선스 수 | `라이선스수` |
| R | MAU | `MAU` |
| S | 계약 시작일 | `계약시작일` |

> 1행은 헤더, 2행부터 데이터. 코드에서 `DATA_START_ROW = 2`로 고정.

### 히스토리 탭 컬럼 구조 (A~G열, 두 탭 동일)

| 열 | 내용 |
|----|------|
| A | 순번 (입력 탭에서는 공란) |
| B | 날짜 |
| C | 유형 (게시물/댓글) |
| D | 영업활동명 |
| E | 그룹ID (신규 추가 시 공란) |
| F | 영업단계 (신규 추가 시 공란) |
| G | 히스토리 내용 + 작성자 |

> **중요**: 히스토리 추가 시 A열에 반드시 빈 문자열을 포함해 7개 값을 전달해야 컬럼이 밀리지 않습니다. (`appendRow` 버그 방지)  
> **그룹ID·영업단계는 신규 추가 시 항상 공란("")으로 처리합니다.** (기존 데이터와 혼용 방지)

---

## 6. 전체 파일 구조

```
public/
├── gooroomee-logo.png            # 구루미 CI 로고 (로그인 페이지 사용)
└── gooroomee-logo.svg            # SVG 버전 (예비)

src/
├── app/                          # Next.js App Router 페이지
│   ├── layout.tsx                # 루트 레이아웃 (세션 확인 → AppShell 조건부 렌더)
│   ├── page.tsx                  # 메인(매출 대시보드) 페이지
│   ├── login/page.tsx            # Google 로그인 페이지 (라이트 디자인 + 구루미 로고)
│   ├── customers/
│   │   ├── page.tsx              # 계약 관리 목록 (검색어 있으면 /customers?q= 검색결과)
│   │   └── [key]/page.tsx        # 고객 상세 페이지
│   ├── settlement/page.tsx       # 정산 캘린더 페이지
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth 핸들러
│       ├── customers/
│       │   ├── create/           # 신규 고객 추가
│       │   ├── update/           # 고객 정보 수정 (ContractCard, SettlementCard, EditCustomerModal)
│       │   ├── delete/           # 고객 삭제 (2단계 확인 후 시트 행 삭제)
│       │   ├── search/           # 고객 검색 (드롭다운용)
│       │   └── stats/            # 통계 데이터
│       └── history/
│           ├── create/           # 히스토리 추가 (작성자 자동 포함)
│           ├── update/           # 히스토리 수정 (날짜·유형·내용)
│           └── delete/           # 히스토리 행 삭제
│
├── auth.ts                       # NextAuth 설정 (Google OAuth, 도메인 제한)
├── middleware.ts                 # 미인증 접근 시 /login 리다이렉트 (이미지 파일 제외)
│
├── lib/                          # 서버 사이드 유틸리티
│   ├── google.ts                 # Google Sheets API 공통 함수
│   ├── customers.ts              # 고객 CRUD 함수 (A:S 범위)
│   ├── history.ts                # 히스토리 CRUD 함수
│   ├── contractItem.ts           # 서비스 자동 추론 로직
│   ├── theme.ts                  # 다크/라이트 테마 색상 토큰
│   └── format.ts                 # 숫자/날짜 포맷 함수
│
└── components/
    ├── layout/
    │   ├── AppShell.tsx          # 전체 레이아웃 (사이드바 + 헤더 + 메인)
    │   ├── Sidebar.tsx           # 좌측 네비게이션 + 로그인 사용자 정보 + 테마 토글
    │   ├── GlobalSearch.tsx      # 상단 전역 검색바 (Enter → /customers?q=)
    │   └── ThemeContext.tsx      # 다크/라이트 모드 Context (기본: 라이트)
    ├── customer/
    │   ├── CustomerHeader.tsx    # 고객 상세 헤더 (영업단계 변경 + 고객정보 수정 버튼)
    │   ├── ContractCard.tsx      # 계약 정보 카드 (계약시작일 포함, 인라인 수정)
    │   ├── SettlementCard.tsx    # 정산 정보 카드 (인라인 수정)
    │   ├── HistoryTimeline.tsx   # 히스토리 타임라인 (추가/수정/삭제, 작성자 분리 표시)
    │   ├── AddHistoryModal.tsx   # 히스토리 추가 모달
    │   └── EditCustomerModal.tsx # 고객 기본정보 수정 + 2단계 삭제 모달
    ├── contracts/
    │   ├── ContractsBoard.tsx    # 계약 관리 메인 (칸반 + 필터)
    │   ├── CustomerKanban.tsx    # 영업단계별 칸반 카드
    │   ├── NewCustomerModal.tsx  # 신규 고객 추가 모달 (계약시작일 포함)
    │   └── CustomerSearchResults.tsx  # 검색 결과 목록 페이지 (/customers?q=)
    ├── settlement/
    │   └── SettlementView.tsx    # 정산 캘린더 뷰 (다크모드 버튼 색상 지원)
    └── ThemeWrapper.tsx          # isDark에 따라 Dashboard/DashboardLight 전환
```

---

## 7. 주요 기능 설명

### 7-1. 인증 흐름

```
사용자 접속
  → middleware.ts 실행 (이미지·정적파일 제외한 모든 경로 인터셉트)
  → 세션 없음 → /login 리다이렉트
  → /login에서 Google 로그인 버튼 클릭
  → auth.ts의 signIn 콜백에서 @gooroomee.com 도메인 확인
  → 통과 시 세션 생성 → 원래 페이지로 이동
```

- 로그아웃 후 다시 로그인하면 **항상 계정 선택 화면**이 뜨도록 설정됨 (`prompt: "select_account"`)
- 로그인한 사용자 이름은 `session.user.name`으로 접근 가능

### 7-2. 데이터 읽기/쓰기 흐름

```
페이지(Server Component)
  → lib/customers.ts 또는 lib/history.ts 함수 호출
  → lib/google.ts의 readRange / appendRow / updateRange / deleteSheetRow 호출
  → Google Sheets API 응답
  → 컴포넌트에 props로 전달
```

- 모든 페이지에 `export const dynamic = "force-dynamic"` 설정 → 매 요청마다 최신 데이터 조회
- 클라이언트 컴포넌트에서 데이터 변경 후 `router.refresh()`를 호출해 서버 데이터 갱신

### 7-3. 고객 식별 키

고객을 찾을 때 우선순위:
1. **영업활동명** (가장 구체적, 메인 키)
2. **그룹ID** (영업활동명 없을 때)
3. **그룹명** (마지막 fallback)

URL은 `encodeURIComponent(영업활동명)`으로 구성됩니다.

### 7-4. 히스토리 작성자 표시

별도 컬럼 없이 내용(G열) 마지막에 작성자를 포함합니다:

```
실제 내용\n\n✍ 작성: 홍길동
```

`HistoryTimeline.tsx`의 `parseContent()` 함수가 이 패턴을 파싱해 화면에 분리 표시합니다.

### 7-5. 히스토리 수정·삭제

- 각 히스토리 항목에 **연필(수정)**, **휴지통(삭제)** 아이콘이 hover 시 표시됩니다
- **수정**: 인라인 폼으로 날짜·유형·내용 변경 → `POST /api/history/update`
- **삭제**: 인라인 확인 버튼("삭제 확인") 클릭 후 삭제 → `POST /api/history/delete`
- 삭제는 Google Sheets에서 해당 행을 실제로 제거합니다 (`DeleteDimensionRequest`)

### 7-6. 고객 수정·삭제

- **고객 상세 페이지** 우측 상단 "고객 정보 수정" 버튼 클릭 → `EditCustomerModal` 열림
- **수정 가능 필드**: 그룹명, 영업활동명, 그룹ID
- **삭제**: 2단계 확인 ("고객 삭제" 버튼 → "정말 삭제하시겠습니까?" 확인) → `DELETE /api/customers/delete` → `/customers`로 리다이렉트
- 영업활동명 변경 시 URL이 바뀌므로 새 URL로 자동 이동

### 7-7. 전역 검색

- 상단 `GlobalSearch` 컴포넌트에서 검색어 입력 후 **Enter** → `/customers?q=검색어`로 이동
- `customers/page.tsx`에서 `searchParams.q`가 있으면 `CustomerSearchResults` 컴포넌트 렌더
- 검색 결과: 영업활동명·그룹명·그룹ID에 검색어가 포함된 고객 목록 표시

### 7-8. 테마 시스템

- 기본값: **라이트 모드** (`useState(false)`)
- `localStorage`의 `"gooroomee-theme"` 키에 `"dark"` 또는 `"light"` 저장
- 처음 방문 시 저장값 없으면 라이트 모드 유지
- 색상 토큰은 `src/lib/theme.ts`의 `DARK`, `LIGHT` 객체로 관리
- 사이드바 하단 토글 버튼으로 전환

### 7-9. 정산 캘린더 다크모드 버튼

정산 유형별 버튼에 라이트/다크 모드 전용 색상이 별도 정의되어 있습니다:

| 유형 | 라이트 배경 | 다크 배경 |
|------|-----------|---------|
| 세금계산서 | `#EEF2FF` | `#4338CA` |
| 카드결제 | `#ECFDF5` | `#065F46` |
| 나라빌 청구 | `#FFFBEB` | `#92400E` |

`SettlementView.tsx`의 `TEMPLATES` 배열에서 `bg/color`(라이트)와 `darkBg/darkColor`(다크)로 관리합니다.

### 7-10. 정산일 파싱

`정산일` 필드는 "15", "25일", "말일" 등 다양한 형식으로 입력됩니다.  
`SettlementView.tsx`의 `parseSettlementDay()` 함수가 숫자로 변환합니다.

### 7-11. 계약 서비스 자동 추론

고객사 `계약항목` 필드가 비어있으면 `영업활동명`과 `그룹유형`으로 서비스를 자동 추론합니다.  
로직은 `src/lib/contractItem.ts`에 있습니다.

---

## 8. API 라우트 목록

모든 API는 `/src/app/api/` 하위에 있습니다.

### 고객 관련

| 메서드 | 경로 | 기능 | 인증 필요 |
|--------|------|------|-----------|
| GET | `/api/customers/search?q=검색어` | 고객 검색 (드롭다운) | 미들웨어로 보호 |
| POST | `/api/customers/create` | 신규 고객 추가 | 미들웨어로 보호 |
| POST | `/api/customers/update` | 고객 정보 수정 | 미들웨어로 보호 |
| DELETE | `/api/customers/delete` | 고객 삭제 (행 제거) | 세션 확인 |
| GET | `/api/customers/stats` | 통계 데이터 | 미들웨어로 보호 |

### 히스토리 관련

| 메서드 | 경로 | 기능 | 인증 필요 |
|--------|------|------|-----------|
| POST | `/api/history/create` | 히스토리 추가 (작성자 자동 포함) | 세션 확인 |
| POST | `/api/history/update` | 히스토리 수정 (날짜·유형·내용) | 세션 확인 |
| POST | `/api/history/delete` | 히스토리 행 삭제 | 세션 확인 |

### 요청/응답 형식 예시

**고객 수정** (`POST /api/customers/update`):
```json
요청: { "key": "한국고용정보원-화상면접", "patch": { "계약만료일": "2026-12-31" } }
응답: { "ok": true, "rowIndex": 5 }
```

**히스토리 추가** (`POST /api/history/create`):
```json
요청: {
  "날짜": "2026-05-15",
  "유형": "게시물",
  "영업활동명": "한국고용정보원-화상면접",
  "그룹ID": "",
  "영업단계": "",
  "내용": "미팅 완료"
}
응답: { "ok": true }
```

**히스토리 삭제** (`POST /api/history/delete`):
```json
요청: { "source": "input", "rowIndex": 5 }
응답: { "ok": true }
```

**고객 삭제** (`DELETE /api/customers/delete`):
```json
요청: { "key": "한국고용정보원-화상면접" }
응답: { "ok": true }
```

---

## 9. 인증 (Google OAuth)

### 설정 위치

| 항목 | 위치 |
|------|------|
| OAuth 클라이언트 | Google Cloud Console → 사용자 인증 정보 |
| 동의 화면 | Google Cloud Console → OAuth consent screen |
| 프로젝트명 | My First Project (Google Cloud) |

### OAuth 클라이언트 설정에서 확인해야 할 것

**승인된 JavaScript 원본**:
```
http://localhost:3000
https://grm-sales.vercel.app
```

**승인된 리디렉션 URI**:
```
http://localhost:3000/api/auth/callback/google
https://grm-sales.vercel.app/api/auth/callback/google
```

> 새 도메인으로 배포하면 여기에 새 URI를 추가해야 합니다.  
> URI 미등록 시 "액세스 차단됨(redirect_uri_mismatch)" 오류 발생.

### 동의 화면 설정 — 중요!

- **사용자 유형**: 반드시 **외부(External)**로 설정해야 합니다
  - `내부(Internal)`로 설정하면 Google Workspace 내부 계정만 접속 가능 → 일반 @gooroomee.com 계정 차단됨
- **게시 상태**: 프로덕션(In production) 권장 (테스트 모드에서는 테스터 목록에 있어야만 로그인 가능)
- 코드 내에서 `@gooroomee.com` 도메인만 허용하므로 외부 계정은 실질적으로 차단됨

### 도메인 제한 코드 위치

`src/auth.ts`:
```typescript
callbacks: {
  signIn({ profile }) {
    return profile?.email?.endsWith("@gooroomee.com") ?? false;
  },
}
```

이 한 줄이 `@gooroomee.com`이 아닌 모든 계정의 로그인을 차단합니다.

---

## 10. 배포 (Vercel + GitHub)

### 저장소 구조

| 저장소 | 용도 | Vercel 프로젝트 |
|--------|------|-----------------|
| `sohyeon1208/grm_test` | 테스트용 | grm-test |
| `sohyeon1208/grm-sales` | **프로덕션** ★ | grm-sales |

### 배포 흐름

```
로컬에서 코드 수정
  → git add / git commit
  → git push grm_sales main
  → GitHub grm-sales 저장소에 push
  → Vercel이 자동으로 빌드 감지
  → 약 1~2분 후 프로덕션 자동 배포 완료
```

### Vercel 설정

- **Framework Preset**: Next.js (자동 감지)
- **Build Command**: `next build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Node.js Version**: 20.x 권장
- **Environment Variables**: Vercel 대시보드 → Settings → Environment Variables에 `.env.local` 내용 모두 등록

### 배포 후 확인 사항

```bash
# 최신 배포 상태 확인
npx vercel ls

# 빌드 로그 확인 (오류 시)
npx vercel logs [배포URL]
```

---

## 11. 외부 서비스 계정 정보

> ⚠️ **보안 주의**: 아래 정보는 퇴사 전 담당자에게 직접 전달하세요. 문서에 실제 키값은 기재하지 않습니다.

| 서비스 | 계정 | 담당 |
|--------|------|------|
| Google Cloud Console | 구루미 조직 계정 | IT팀 또는 담당자 |
| Google Sheets (데이터) | 서비스 계정으로 접근 | — |
| Vercel | sohyeon1208 계정 | 인수인계 필요 |
| GitHub | sohyeon1208/grm-sales | 인수인계 필요 |

### 인수인계 체크리스트

- [ ] `.env.local` 파일 내용 전달 (Slack DM 또는 1Password 등 보안 채널)
- [ ] Vercel 프로젝트 `grm-sales` 소유권 이전 또는 새 계정에 팀 멤버 추가
- [ ] GitHub 저장소 `grm-sales` 접근 권한 부여
- [ ] Google Cloud Console 서비스 계정 키 전달
- [ ] Google Sheets 공유 권한 확인 (서비스 계정 이메일에 편집 권한)
- [ ] Google OAuth 클라이언트의 리디렉션 URI에 새 도메인 추가 (도메인 변경 시)

---

## 12. 향후 개발 시 주의사항

### Next.js 16 특이사항

```typescript
// ❌ 이전 방식 (Next.js 14 이하)
export default function Page({ params }) {
  const { key } = params;  // 오류!
}

// ✅ Next.js 16 방식 (params가 Promise)
type Props = { params: Promise<{ key: string }> };
export default async function Page({ params }: Props) {
  const { key } = await params;
}

// searchParams도 동일
type Props = { searchParams: Promise<{ q?: string }> };
export default async function Page({ searchParams }: Props) {
  const { q } = await searchParams;
}
```

### Google Sheets API 주의사항

**행 추가 시 컬럼 오프셋 버그**:
```typescript
// ❌ 잘못된 방식 — B열부터 쓰면 실제로는 A열부터 삽입됨
await appendRow("시트!B:G", [값1, 값2, ...]);

// ✅ 올바른 방식 — A열 포함하여 빈 문자열로 시작
await appendRow("시트!A:G", ["", 값1, 값2, ...]);
```

**행 삭제 시 rowIndex**:
- 코드에서 `rowIndex`는 **1-based** (1행 = 헤더, 2행 = 첫 데이터)
- Google Sheets API `DeleteDimensionRequest`의 `startIndex`는 **0-based**
- 변환: `startIndex = rowIndex - 1`
- sheetId는 숫자(numeric)로 지정해야 하며, `getNumericSheetId()` 헬퍼 함수로 조회합니다

### 미들웨어(middleware.ts) 주의사항

`src/middleware.ts`의 matcher 패턴에서 정적 파일을 반드시 제외해야 합니다:

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico).*)"
  ],
};
```

이미지·폰트 등 정적 파일을 제외하지 않으면 **로그인 전에 이미지가 로드되지 않는 버그**가 발생합니다.  
새로운 파일 확장자를 `public/`에 추가할 경우 이 패턴도 함께 업데이트하세요.

### 컬럼 추가 시

새 컬럼을 추가하려면 반드시 아래를 모두 수정해야 합니다:
1. `src/lib/customers.ts` — `Customer` 타입에 필드 추가
2. `src/lib/customers.ts` — `rowToCustomer()` 함수에 `row[N]` 추가
3. `src/lib/customers.ts` — `customerToRow()` 함수에 값 추가
4. `src/lib/customers.ts` — `EMPTY_CUSTOMER`에 기본값 추가
5. 읽기 범위 변경: `readRange("A2:S")` → `readRange("A2:T")` 등
6. 쓰기 범위 변경: `updateRange("A2:S2")` → `updateRange("A2:T2")` 등
7. 관련 컴포넌트 UI에 필드 추가 (ContractCard, NewCustomerModal 등)

### 테마 컬러 변경

모든 색상은 `src/lib/theme.ts`에서 중앙 관리합니다:
```typescript
export const DARK = {
  bg: { page: "#13141F", card: "#22253B" },
  text: { primary: "rgba(255,255,255,0.92)", secondary: "rgba(255,255,255,0.68)", muted: "rgba(255,255,255,0.48)" },
  border: "rgba(255,255,255,0.10)",
};
export const LIGHT = {
  bg: { page: "#F0F2F8", card: "#ffffff" },
  // ...
};
```
여기만 수정하면 테마 색상이 전체 앱에 반영됩니다.

### 히스토리 탭 이름 변경 시

`src/lib/history.ts` 상단 상수:
```typescript
export const HISTORY_ARCHIVE_SHEET = "히스토리 전체";
export const HISTORY_INPUT_SHEET = "히스토리 입력";
```
Google Sheets 탭 이름과 **정확히 일치**해야 합니다 (공백, 이모지 포함).

### 로고 교체 시

- 로고 파일은 `public/gooroomee-logo.png`에 위치합니다
- 로그인 페이지(`src/app/login/page.tsx`)의 `<img src="/gooroomee-logo.png" />` 경로를 함께 변경하세요
- 파일명에 `[`, `]` 등 특수문자가 있으면 PowerShell에서 복사 시 `-LiteralPath` 옵션을 사용해야 합니다:
  ```powershell
  Copy-Item -LiteralPath "원본파일명" -Destination "public/gooroomee-logo.png"
  ```

---

*이 문서는 2026년 5월 15일 기준으로 작성되었습니다. 기능 추가 후 반드시 업데이트해주세요.*
