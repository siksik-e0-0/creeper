# CLAUDE.md - Creeper 프로젝트 개발 가이드

## 핵심 파일

| 파일 | 역할 | 비고 |
|------|------|------|
| `/tmp/game_full.js` | 게임 로직 원본 (~5,800줄) | 여기서 편집 |
| `src/components/gameJs.ts` | 빌드용 (escaped string) | 직접 편집 금지 |
| `src/components/gameHtml.ts` | 게임 HTML 템플릿 | escaped string |
| `src/app/globals.css` | 전체 UI 스타일 | 직접 편집 가능 |
| `src/app/page.tsx` | Next.js 페이지 | 게임 컨테이너 |
| `/tmp/rebuild.js` | game_full.js → gameJs.ts 변환 | 세션마다 재생성 필요 |

## 빌드 워크플로우

```bash
# 1. /tmp/game_full.js에서 게임 코드 추출 (세션 시작 시)
node -e "
const fs = require('fs');
const src = fs.readFileSync('src/components/gameJs.ts','utf8');
const s = src.indexOf(\"= '\") + 3;
const e = src.lastIndexOf(\"';\");
const decoded = src.substring(s,e).replace(/\\\\n/g,'\\n').replace(/\\\\'/g,\"'\").replace(/\\\\\\\\/g,'\\\\');
fs.writeFileSync('/tmp/game_full.js', decoded);
console.log('Extracted:', decoded.length);
"

# 2. rebuild 스크립트 생성 (세션 시작 시)
cat > /tmp/rebuild.js << 'SCRIPT'
const fs = require('fs');
const src = fs.readFileSync('/tmp/game_full.js', 'utf8');
const escaped = src.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
const output = `// Auto-generated: game script\nexport const GAME_JS = '${escaped}';\n`;
fs.writeFileSync('src/components/gameJs.ts', output);
console.log('Rebuilt gameJs.ts:', output.length, 'chars');
SCRIPT

# 3. 편집 → 검증 → 빌드
node --check /tmp/game_full.js   # 구문 검사
node /tmp/rebuild.js              # gameJs.ts 갱신
npx next build                    # 프로덕션 빌드
```

## 게임 코드 주요 구간 (game_full.js)

| 줄 범위 (대략) | 섹션 |
|----------------|------|
| 1-50 | Canvas, Constants (PX=3, SPRITE_W=16) |
| 50-140 | Sprite 데이터 (CREEPER, REAPER, PLAYER) + drawSprite() |
| 140-320 | Particle, Trail, FloatingText 시스템 |
| 320-650 | **WFC 타일맵** (wfcGenerate, buildTilemap, decorations) |
| 650-1100 | Player 클래스 |
| 1100-1550 | Creeper 클래스 |
| 1550-1750 | Reaper 클래스 + Laser |
| 1750-2200 | Item 시스템 |
| 2200-2400 | Stage Config, STAGE_BG, STAGE_THEME, buildStageWalls |
| 2400-2600 | Stage Clear (triggerStageClear, nonHostStageClear) |
| 2600-2800 | 특수 크리퍼 (해커/쉴드/바이러스) |
| 2800-3100 | **스킬 시스템** (SKILL_DEFS, showSkillLevelUp, skillSync) |
| 3100-3400 | 스킬 효과 (useSkill, tick) |
| 3400-3500 | Chat 시스템 |
| 3500-3800 | Score, GameOver, Ending |
| 3800-4500 | **Main Loop** (loop() 함수) |
| 4500-5200 | **Multiplayer** (Supabase, subscribeGameRoom, broadcast) |
| 5200-5900 | 이벤트 핸들러, 시작/종료 로직 |

## WFC (Wave Function Collapse) 시스템

- `WFC_TILE = 8` (8px 타일, 고해상도)
- 3종 지형: `WFC_G=0`(풀), `WFC_W=1`(물), `WFC_D=2`(흙)
- 인접 제약: 물↔흙 인접 불가 (`WFC_ADJ` 매트릭스)
- 씨앗: 호수(타원+노이즈), 흙길(사인파 구불구불)
- 집: `wfcDrawHouse()` — 4x3 타일 크기

## 스테이지 테마 (4 Tier)

| Tier | Stages | 배경 | 벽 | 장식 |
|------|--------|------|-----|------|
| 0 | 1-3 | 올리브 들판 | 나무 울타리 | 꽃, 풀, 돌 |
| 1 | 4-6 | 사막/황야 | 사암 울타리 | 선인장, 마른풀 |
| 2 | 7-9 | 설원 | 얼음 벽 | 눈더미, 결정 |
| 3 | 10 | 마법숲 | 마법 결계 | 버섯, 크리스탈 |

## CSS 색상 체계

- 주 액센트: `#FFD700` (골드)
- 배경: `rgba(42,28,12)` (다크 브라운)
- 테두리: `#8B6914` (골드 브라운)
- 본문 텍스트: `#F0E6D0` (아이보리)
- 성공/HP: `#88DD44` (밝은 녹색)
- 위험: `#ff4422` (빨강)
- 멀티플레이: `#88CCEE` (하늘색)

## 멀티플레이어 아키텍처

- **위치 동기화**: Supabase Broadcast (`bcastChannel`, event: `pos`)
- **게임 이벤트**: Supabase Postgres Changes (`multi_events` 테이블)
- **스킬 동기화**: Broadcast (`skill_select`, `skill_done`)
- **하트비트**: 5초 간격 `last_seen` 갱신
- **안전 타임아웃**: 스킬 선택 30초, stale 플레이어 30초

## 테스트

```bash
# Playwright 기반 (headless Chrome)
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  // ... 테스트 코드
})();
"
```

## Git 브랜치

- `main` — 프로덕션 (Vercel 자동 배포)
- `claude/improve-multi-game-UIMED` — 현재 개발 브랜치
