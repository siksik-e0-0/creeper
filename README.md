# Creeper - ARPANET 1971

1971년 ARPANET에 침입한 최초의 자기복제 바이러스 **Creeper**를 추적하는 브라우저 게임.

## Screenshot

![Gameplay](public/ss_game1.png)

## Features

### Gameplay
- 마우스/터치로 캐릭터 조작, 크리퍼에 접근하면 자동 포획
- 10 스테이지 (스테이지별 고유 벽 레이아웃 + 난이도 상승)
- 리퍼 AI 4단계 진화 (순찰 → 매복 → 추적 → 포식자)
- 하트 3개, 리퍼 공격 시 1개 소모
- 30% 확률 아이템 출현 (속도업, 무적, 시야확장 등)
- 콤보 시스템, 크리퍼 복제, 특수 크리퍼 (해커/쉴드/바이러스)
- 이어하기 퀴즈 챌린지

### Skill System
- 3라인 x 3레벨 스킬 트리
  - A: 레이더 → 스캔 → 오라클 (탐지)
  - B: 방패 → 반사 → 버블 (방어)
  - C: 유인 → 폭탄 → 블랙홀 (공격)
- 스테이지 클리어 시 SP +1, 스킬 업그레이드 선택

### Multiplayer
- Supabase Realtime 기반 실시간 멀티플레이
- 브로드캐스트 위치 동기화 (보간 처리)
- 스킬 선택 동기화 (모든 플레이어 대기 + 실시간 선택 표시)
- 멀티 결과 패널, MVP 선정
- 사망 후 리조인 가능

### Visual (Pixel Art RPG)
- WFC(Wave Function Collapse) 프로시저럴 타일맵 (8px 고해상도)
- 3종 지형: 풀밭 / 호수 / 흙길 (인접 제약 기반)
- 스테이지 테마: 초원 → 사막 → 설원 → 마법숲
- 자동 생성: 호수(노이즈 타원), 구불구불 흙길, 집, 나무, 꽃, 바위
- 나무 울타리 벽, 환경 장식 20+종

## Tech Stack

| 항목 | 기술 |
|------|------|
| Framework | Next.js (App Router) |
| Rendering | Canvas 2D API |
| Multiplayer | Supabase Realtime (Broadcast + Postgres Changes) |
| Database | Supabase (room_players, multi_events, scores) |
| Deploy | Vercel |
| Language | TypeScript (페이지) + Vanilla JS (게임 로직) |

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # 메인 페이지 (게임 컨테이너)
│   ├── globals.css       # 전체 UI 스타일 (1,270+ lines)
│   └── api/scores/       # 점수 API
├── components/
│   ├── gameJs.ts         # 게임 로직 (단일 escaped string, ~5,800 lines)
│   └── gameHtml.ts       # 게임 HTML 템플릿
└── lib/
    └── supabase.ts       # Supabase 클라이언트
public/
└── ss_game1.png          # 게임 스크린샷
```

### 게임 코드 구조 (gameJs.ts 내부)

게임 로직은 `/tmp/game_full.js`에서 편집 후 rebuild 스크립트로 `gameJs.ts`에 주입.

```
Canvas / Constants / Sprites          # 렌더링 기반
WFC Tilemap + Decorations             # 배경 생성 (WFC 알고리즘)
Player / Creeper / Reaper classes     # 엔티티
Stage Config / Wall Builder           # 스테이지 설정
Skill System (SKILL_DEFS)             # 스킬 정의 + 레벨업 UI
Item System                           # 아이템 박스
Multiplayer (Supabase Realtime)       # 멀티 동기화
Main Loop (loop())                    # 메인 게임 루프
```

## Development

```bash
npm install
npm run dev        # 개발 서버 (localhost:3000)
npm run build      # 프로덕션 빌드
```

### 게임 코드 수정 워크플로우

```bash
# 1. game_full.js 편집 (일반 JS)
vim /tmp/game_full.js

# 2. 구문 검사
node --check /tmp/game_full.js

# 3. gameJs.ts로 rebuild (escaped string 변환)
node /tmp/rebuild.js

# 4. 빌드 확인
npm run build
```

## Deploy

Vercel에 `main` 브랜치 push 시 자동 배포.

```bash
git push origin main
```
