# Hosung Lean Stack 실험 프로젝트

## 개요

이 프로젝트는 **Lean Stack**을 기반으로 한 MVP 개발 실험 환경입니다.
빠른 개발, 서버리스 아키텍처, 문서화기반의 비즈니스 흐름을 테스트합니다.

## Lean Stack 구성

| 계층                  | 기술/서비스                                               | 역할                        |
| ------------------- | ---------------------------------------------------- | ------------------------- |
| **프론트엔드**           | Flutter (Web, iOS, Android)                          | UI/UX 구현, 상태 관리           |
| **BFF(API)**        | Cloudflare Workers + Hono (TypeScript)               | 인증 처리, 비즈니스 로직, 외부 서비스 연동 |
| **DB/Auth/Storage** | Supabase (PostgreSQL, Auth, Storage)                 | 데이터 저장, JWT 기반 인증, 파일 저장  |
| **결제**              | Stripe(글로벌) / 토스페이먼츠(국내)                             | 결제·예산 충전                  |
| **알림**              | Slack Webhook                                        | 운영 알림                     |
| **모니터링/로깅**         | Sentry, Supabase Logs                                | 클라이언트\~BFF 에러 추적, 성능 모니터링 |
| **배포/CI**           | Vercel(Flutter Web), Wrangler(BFF), GitLab/GitHub CI | 자동 빌드·배포                  |

## 프로젝트 구조

```
project-root/
├─ frontend/              # Flutter 앱
│  ├─ lib/
│  │  ├─ config/          # 앱 설정
│  │  ├─ services/        # Supabase 서비스
│  │  ├─ providers/       # 상태 관리
│  │  └─ screens/         # UI 화면
│  └─ pubspec.yaml
├─ bff/                   # Cloudflare Workers + Hono
│  ├─ src/
│  │  ├─ lib/             # Supabase 클라이언트
│  │  ├─ middleware/      # 인증 미들웨어
│  │  └─ routes/          # API 라우트
│  ├─ package.json
│  └─ wrangler.toml
├─ supabase/              # 데이터베이스 스키마
│  └─ schema.sql
├─ api-spec/              # OpenAPI 명세
├─ infra/                 # IaC (Cloudflare, Supabase 설정)
├─ docs/                  # 프로젝트 문서
│  ├─ guides/             # 개발 가이드들
│  │  └─ flutter-supabase-auth-tutorial.md
│  ├─ DEVELOPMENT.md      # 개발 환경 설정
│  └─ INFRASTRUCTURE.md   # 인프라 구조
├─ api-spec/              # OpenAPI 명세
├─ infra/                 # IaC (Cloudflare, Supabase 설정)
└─ README.md
```

## 실험 목표

1. Flutter ↔ BFF ↔ Supabase 데이터 흐름 검증
2. JWT 기반 인증/인가 처리
3. 결제 후 예산 차감 로직(CPC/CPL)
4. Sentry로 에러 모니터링
5. CI/CD 자동 배포

## 빠른 시작

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `supabase/schema.sql` 파일의 내용을 SQL Editor에서 실행
3. Settings > API에서 URL과 anon key 복사

### 2. 환경 변수 설정

#### Flutter (frontend/)
```bash
# 환경 변수 설정 (실행 시)
flutter run -d chrome \
  --dart-define=SUPABASE_URL=your-supabase-url \
  --dart-define=SUPABASE_ANON_KEY=your-supabase-anon-key \
  --dart-define=BFF_BASE_URL=http://localhost:8787
```

#### BFF (bff/)
```bash
# .env 파일 생성 (bff/env.example 참고)
cp bff/env.example bff/.env

# 환경 변수 편집
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. 개발 서버 실행

#### BFF API 실행
```bash
cd bff
npm install
npm run dev
```

#### Flutter 앱 실행
```bash
cd frontend
flutter pub get
flutter run -d chrome
```

## 📱 기능

### 인증 시스템
- ✅ 회원가입 (이메일/비밀번호)
- ✅ 로그인/로그아웃
- ✅ 비밀번호 재설정
- ✅ JWT 토큰 기반 인증
- ✅ 사용자 프로필 관리

### API 엔드포인트

#### 인증 관련
- `POST /auth/signup` - 회원가입
- `POST /auth/signin` - 로그인
- `POST /auth/signout` - 로그아웃
- `POST /auth/refresh` - 토큰 새로고침
- `GET /auth/me` - 현재 사용자 정보

#### 사용자 관련
- `GET /user/profile` - 프로필 조회
- `PUT /user/profile` - 프로필 업데이트
- `DELETE /user/account` - 계정 삭제

## 개발 환경

### 1) 프론트엔드

* Flutter SDK 설치
* 환경변수:

  ```
  SUPABASE_URL=
  SUPABASE_ANON_KEY=
  BFF_BASE_URL=
  SENTRY_DSN=
  ```

### 2) BFF(API)

* Node.js 20+
* Wrangler CLI 설치:

  ```bash
  npm install -g wrangler
  ```
* 환경변수:

  ```
  SUPABASE_JWT_SECRET=
  SLACK_WEBHOOK_URL=
  SENTRY_DSN=
  ```

## 실행 방법

### 프론트엔드 (Flutter Web 예시)

```bash
cd frontend
flutter pub get
flutter run -d chrome \
  --dart-define=SUPABASE_URL=$SUPABASE_URL \
  --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  --dart-define=BFF_BASE_URL=$BFF_BASE_URL \
  --dart-define=SENTRY_DSN=$SENTRY_DSN
```

### BFF(API)

```bash
cd bff
npm install
npx wrangler dev
```

## 문서

### 개발 가이드
- **[개발 가이드 목록](docs/guides/README.md)** - 모든 가이드의 목록과 개요
- **[Flutter + Supabase Auth 튜토리얼](docs/guides/flutter-supabase-auth-tutorial.md)** - 인증 시스템 구현 가이드
- **[개발 환경 설정](docs/DEVELOPMENT.md)** - 전체 프로젝트 개발 환경
- **[인프라 구조](docs/INFRASTRUCTURE.md)** - 인프라 아키텍처 및 설정

### 빠른 참조
- **Supabase 설정**: 프로젝트 생성 후 `supabase/schema.sql` 실행
- **Flutter 개발**: `lib/services/supabase_service.dart` - Supabase 클라이언트 래퍼
- **BFF 개발**: `src/middleware/auth.ts` - JWT 인증 미들웨어

## 🚀 배포

### BFF 배포 (Cloudflare Workers)
```bash
cd bff
npm run deploy:staging    # 스테이징
npm run deploy:production # 프로덕션
```

### Flutter Web 배포 (Vercel)
```bash
cd frontend
flutter build web
# Vercel에 배포
```

## 라이선스

이 프로젝트는 실험용이며 상용 서비스 적용 전 보안, 성능, 법적 요건을 반드시 검토해야 합니다.
