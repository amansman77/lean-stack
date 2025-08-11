# 인프라 구조 

## 주요 인프라 구성

| 계층        | 기술/서비스                    | 설명                           |
| --------- | ------------------------- | ---------------------------- |
| 클라이언트     | Flutter (Web + Mobile)    | 크로스 플랫폼 앱                    |
| API 게이트웨이 | Cloudflare Workers + Hono | BFF, JWT 인증, 외부 API 연동       |
| 데이터 플랫폼   | Supabase                  | PostgreSQL, Auth, Storage 통합 |
| 결제 시스템    | Stripe                    | 글로벌 결제 대응                    |
| 알림        | Slack Webhook             | 운영 알림                        |
| 로깅        | Sentry + Supabase Logs    | 오류 추적 및 사용자 행동 분석            |
| 캐시 (예정)   | Cloudflare KV / R2        | 글로벌 엣지 캐시                    |
| 배포        | Vercel + Wrangler         | 프론트/백엔드 각각의 서버리스 배포          |

## 인프라 확장 계획

* Supabase Read Replica 도입 (MAU 5만 이상 시)
* Stripe Webhook 멱등 처리 큐 설계
* Cloudflare KV → 인기 콘텐츠 캐싱
* 지역별 사용자 분산 대응 구조 검토 (Cloudflare Geo)

## 보안/정책

* Supabase RLS(Row-Level Security) 사용
* 환경 변수는 Wrangler + GitHub Actions Secrets로 관리

## 모니터링

* BFF 에러 추적: Sentry
* 사용자 이벤트/DB 로그: Supabase Logs
* 운영 이벤트 알림: Slack Webhook

## 요금 관리

* Supabase: Pro → Team 플랜 전환 고려
* Cloudflare: Workers 무료 티어 → Paid 전환 시 RPS 기준으로 확장
* Stripe: 수수료 기반
* Sentry: 사용자/에러 기준 요금제 확인 예정
