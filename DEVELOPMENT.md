# 개발 가이드 

## 📌 프로젝트 개요

* **목표**: MAU 100,000까지 확장 가능한 Lean Stack 기반의 글로벌 서비스 구축
* **주요 기술 스택**: Flutter, Cloudflare Workers (Hono), Supabase, Stripe
* **구조 철학**: 프론트/백엔드 분리, 서버리스 기반, 글로벌 엣지 실행, 유지보수 최소화

## 디렉토리 구조 (예시)

```
project-root/
├── frontend/             # Flutter 앱
├── bff/                  # Cloudflare Workers + Hono API
├── shared/               # 공통 타입, 환경 설정
└── docs/                 # 문서 (DEVELOPMENT.md, INFRASTRUCTURE.md 등)
```

## 프론트엔드 개발

* **언어/프레임워크**: Dart + Flutter
* **IDE**: Visual Studio Code (Flutter Extension 필수)
* **환경 설정**:

  * Flutter SDK 설치
  * `flutter pub get`
  * 디바이스 연결 또는 `flutter run -d chrome`
* **주요 플러그인**:

  * Flutter Extension Pack
  * Flutter Intl (다국어 지원)

## 백엔드 개발 (BFF)

* **플랫폼**: Cloudflare Workers
* **프레임워크**: Hono (TypeScript 기반)
* **CLI 도구**: Wrangler
* **API 역할**:

  * Supabase 연동 (Auth, DB)
  * Stripe 결제 처리
  * Slack Webhook 알림
  * JWT 인증 처리

### 예시 명령어

```bash
cd bff
npm install
npx wrangler dev      # 로컬 개발 서버
npx wrangler deploy   # 배포
```

## 인증/보안

* Supabase JWT를 사용하여 BFF에서 직접 검증
* 인증 미들웨어는 Hono에서 처리

## 테스트

* Flutter: `flutter test`
* BFF: Vitest or custom test setup (선택)

## CI/CD

* GitHub Actions 기반 자동 배포 (예정)
* Flutter Web → Vercel, BFF → Cloudflare Workers
