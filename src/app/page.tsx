'use client'

import { useEffect } from 'react'
import { GAME_HTML } from '@/components/gameHtml'
import { GAME_JS }   from '@/components/gameJs'

// 빌드 시점 버전 — Vercel 배포마다 자동 갱신
const _now       = new Date()
const BUILD_DATE = _now.toISOString().slice(0, 10).replace(/-/g, '.')
const BUILD_TIME = _now.toISOString().slice(11, 16)  // HH:MM (UTC)
const VERSION    = `v2.1.0 (${BUILD_DATE} ${BUILD_TIME})`

// 모듈 레벨 플래그 — StrictMode 이중 실행 완전 차단
let _gameBooted = false

export default function GamePage() {
  useEffect(() => {
    if (_gameBooted) return
    _gameBooted = true

    // ── 1. 환경변수 주입 ──────────────────────────────────────
    const envScript = document.createElement('script')
    envScript.textContent = [
      `window.__SB_URL__       = ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL       ?? '')};`,
      `window.__SB_ANON__      = ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  ?? '')};`,
      `window.__GAME_VERSION__ = ${JSON.stringify(VERSION)};`,
    ].join('\n')
    document.head.appendChild(envScript)

    // ── 2. 버전 표시 ──────────────────────────────────────────
    const verEl = document.getElementById('overlay-version')
    if (verEl) verEl.textContent = VERSION

    // ── 3. 게임 스크립트 실행 함수 ───────────────────────────
    const runGame = () => {
      const gameScript = document.createElement('script')
      gameScript.textContent = GAME_JS
      document.body.appendChild(gameScript)
    }

    // ── 4. Supabase CDN 로드 후 게임 실행 ────────────────────
    // 이미 로드된 경우(캐시) 즉시 실행
    if (typeof (window as any).supabase !== 'undefined') {
      runGame()
      return
    }

    const sbScript = document.createElement('script')
    sbScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
    // async=false: DOM에 추가되는 순간 동기 로드 (load 이벤트 누락 방지)
    sbScript.async = false
    sbScript.onload  = runGame
    sbScript.onerror = runGame   // CDN 실패해도 싱글로 동작
    document.head.appendChild(sbScript)

    // 4초 fallback (절대 실패 없도록)
    const t = setTimeout(runGame, 4000)
    sbScript.onload = () => { clearTimeout(t); runGame() }

    // cleanup 없음 — script는 페이지 생애 동안 유지
  }, [])

  return (
    <div
      id="game-root"
      dangerouslySetInnerHTML={{ __html: GAME_HTML }}
    />
  )
}
