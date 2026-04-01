# 스마트학생복 매장 자동화 웹앱

스마트학생복 춘천점 셀프 주문 / 예약 / 재고관리 / 통계 시스템  
(Next.js 14 + TypeScript + Tailwind CSS + Supabase)

---

## 📁 전체 폴더 구조

```
smart-uniform-app/
├── src/
│   ├── app/
│   │   ├── page.tsx                        → / 루트 (→ /customer 리다이렉트)
│   │   ├── layout.tsx                      → 루트 레이아웃 (Toast 포함)
│   │   ├── globals.css                     → 전역 스타일
│   │   │
│   │   ├── customer/                       ── 손님용 화면 ──
│   │   │   ├── layout.tsx                  → 하단 네비 포함 레이아웃
│   │   │   ├── page.tsx                    → 홈 (시작하기 버튼)
│   │   │   ├── CustomerContext.tsx         → 장바구니 + 고객정보 전역상태
│   │   │   ├── start/page.tsx              → 학교선택→기본정보→주문유형 (3단계)
│   │   │   ├── order/
│   │   │   │   ├── products/page.tsx       → 교복 상품 목록
│   │   │   │   ├── pe/page.tsx             → 체육복 주문
│   │   │   │   ├── nameplate/page.tsx      → 명찰 주문
│   │   │   │   └── complete/page.tsx       → 주문완료 (영수증 + 자동이동)
│   │   │   ├── cart/page.tsx               → 장바구니
│   │   │   ├── repair/
│   │   │   │   ├── page.tsx                → 수선 접수
│   │   │   │   └── complete/page.tsx       → 수선 완료
│   │   │   ├── reservation/
│   │   │   │   ├── page.tsx                → 예약 (날짜→시간→확인)
│   │   │   │   └── complete/page.tsx       → 예약 완료
│   │   │   ├── exchange/
│   │   │   │   ├── page.tsx                → 환불/교환 문의
│   │   │   │   └── complete/page.tsx       → 문의 완료
│   │   │   └── mypage/page.tsx             → 마이페이지 (주문/예약/수선 조회)
│   │   │
│   │   └── admin/                          ── 관리자 화면 ──
│   │       ├── page.tsx                    → 로그인
│   │       ├── layout.tsx                  → 사이드바 레이아웃
│   │       ├── dashboard/page.tsx          → 대시보드
│   │       ├── orders/page.tsx             → 주문 관리 (상태변경 + 판매확정)
│   │       ├── reservations/page.tsx       → 예약 관리 (날짜별 타임슬롯)
│   │       ├── repairs/page.tsx            → 수선 관리
│   │       ├── exchange/page.tsx           → 환불/교환 관리
│   │       ├── inventory/page.tsx          → 재고 관리 (인라인 수정)
│   │       ├── statistics/page.tsx         → 판매 통계 (차트 + 표)
│   │       └── products/page.tsx           → 상품/가격 관리
│   │
│   ├── components/
│   │   ├── ui/index.tsx                    → Button, Input, Select, Modal, TopBar, StepIndicator, QuantityPicker
│   │   └── customer/BottomNav.tsx          → 하단 고정 네비게이션
│   │
│   ├── lib/
│   │   ├── supabase.ts                     → Supabase 클라이언트
│   │   ├── utils.ts                        → 유틸 함수 (포맷, 번호생성, 색상 등)
│   │   └── localData.ts                    → 가격표 이미지 기반 학교/가격 데이터
│   │
│   └── types/
│       └── database.ts                     → 전체 TypeScript 타입 정의
│
├── supabase-schema.sql                     → DB 스키마 (실행 필수)
├── supabase-sample-data.sql                → 샘플 데이터
├── .env.local.example                      → 환경변수 예시
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🚀 빠른 시작

### 1. 프로젝트 설치

```bash
git clone <repo>
cd smart-uniform-app
npm install
```

### 2. Supabase 설정

1. [supabase.com](https://supabase.com) → 새 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 전체 실행
3. SQL Editor에서 `supabase-sample-data.sql` 실행 (선택)
4. Project Settings → API → URL과 anon key 복사

### 3. 환경변수 설정

```bash
cp .env.local.example .env.local
# .env.local 파일 열어서 Supabase URL, ANON_KEY 입력
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
NEXT_PUBLIC_ADMIN_PASSWORD=smart2026!
NEXT_PUBLIC_ADMIN_STORE_NAME=스마트학생복 춘천점
```

### 4. 실행

```bash
npm run dev
# http://localhost:3000
```

---

## 🔑 접속 URL

| 화면 | URL | 설명 |
|------|-----|------|
| 손님 홈 | `/customer` | 시작하기 버튼 |
| 주문 시작 | `/customer/start` | 학교→정보→유형 |
| 교복 주문 | `/customer/order/products` | 상품 선택 |
| 체육복 | `/customer/order/pe` | 사이즈 선택 |
| 명찰 | `/customer/order/nameplate` | 명찰 정보 |
| 장바구니 | `/customer/cart` | 주문 확정 |
| 수선 접수 | `/customer/repair` | 수선 신청 |
| 예약 | `/customer/reservation` | 날짜/시간 예약 |
| 환불/교환 | `/customer/exchange` | 문의 신청 |
| 마이페이지 | `/customer/mypage` | 이력 조회 |
| **관리자 로그인** | `/admin` | 비밀번호: `smart2026!` |
| 관리자 대시보드 | `/admin/dashboard` | |
| 주문 관리 | `/admin/orders` | 판매확정 포함 |
| 예약 관리 | `/admin/reservations` | 날짜별 타임슬롯 |
| 수선 관리 | `/admin/repairs` | |
| 환불/교환 | `/admin/exchange` | |
| 재고 관리 | `/admin/inventory` | 인라인 수정 |
| 통계 | `/admin/statistics` | 차트 + 표 |
| 상품 관리 | `/admin/products` | 가격/사이즈 수정 |

---

## 🏫 포함된 학교 목록 (24개)

**고등학교:** 춘천고, 성수고, 기계공고, 사대부고, 봉의고, 한샘고, 강원생명과학고, 춘천여고, 유봉여고, 성수여고  
**중학교:** 남춘천중, 춘천중, 봄내중, 후평중, 소양중, 대룡중, 우석중, 봉의중, 강원중, 퇴계중, 유봉여중, 남춘천여중  
**기타:** 가평화천양구, 교대부설초교

---

## 💰 2026 가격표 (이미지 기반 내장)

`src/lib/localData.ts`에 학교별 동복/하복 가격이 모두 저장되어 있습니다.  
Supabase에 상품 데이터가 없어도 가격표가 화면에 표시됩니다.

---

## 🗄️ DB 스키마 요약

| 테이블 | 역할 |
|--------|------|
| `schools` | 학교 목록 |
| `products` | 상품 (학교별) |
| `product_variants` | 사이즈별 변형 |
| `inventory` | 재고 (variant 1:1) |
| `customers` | 고객 정보 |
| `orders` | 주문 |
| `order_items` | 주문 항목 |
| `reservations` | 예약 (30분 단위, 최대 5명) |
| `repair_requests` | 수선 접수 |
| `exchange_refund_requests` | 환불/교환 문의 |
| `sales_logs` | 재고 차감 이력 |
| `admin_users` | 관리자 계정 |

---

## 📱 태블릿 최적화

- 최대 너비 672px (`max-w-2xl`) 중앙 정렬
- 터치 영역 최소 44px
- `-webkit-tap-highlight-color: transparent`
- 하단 네비 고정 (`fixed bottom-0`)
- `user-select: none` on interactive elements

---

## ⚡ 실시간 동기화

Supabase Realtime으로 다음 테이블이 실시간 구독됩니다:
- `orders` — 주문 현황
- `inventory` — 재고 변동
- `reservations` — 예약 현황

여러 태블릿에서 동시 접속 시 자동 반영됩니다.

---

## 🐛 주의사항

1. **환경변수 누락** — `.env.local` 없으면 Supabase 연결 오류 발생
2. **RLS 정책** — 스키마 SQL에 포함됨. `anon` 키로도 읽기/쓰기 가능
3. **관리자 비밀번호** — `NEXT_PUBLIC_ADMIN_PASSWORD` 환경변수로 변경 권장
4. **재고 동시성** — 예약 시 count 재확인으로 초과 방지
5. **날짜 처리** — `date-fns` 사용, 한국 시간대 고려 필요시 `date-fns-tz` 활용
6. **샘플 데이터** — `supabase-sample-data.sql`은 학교 등록 후 실행

---

## 🔧 추후 확장 포인트

- [ ] SMS 문자 알림 (CoolSMS API 연동)
- [ ] 카카오톡 알림톡
- [ ] 결제 모듈 (토스페이먼츠)
- [ ] 바코드/QR 주문번호 스캔
- [ ] 학교별 상품 카탈로그 이미지 업로드
- [ ] 엑셀 내보내기 (주문/재고)
- [ ] PWA (오프라인 캐시)
- [ ] 관리자 멀티계정 (Supabase Auth)
