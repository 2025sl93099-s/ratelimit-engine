/**
 * @fileoverview Live dashboard entry point.
 * Starts a demo server with rate limiting wired to the DashboardCollector,
 * then renders the terminal UI at 10ms intervals.
 *
 * Usage: npx ratelimit-engine dashboard
 */

import { DashboardCollector } from '../src/dashboard/DashboardCollector.js'
import { DashboardRenderer }  from '../src/dashboard/DashboardRenderer.js'
import { createLimiter }      from '../src/engine/createLimiter.js'
import { TokenBucket }        from '../src/algorithms/TokenBucket.js'
import { FixedWindow }        from '../src/algorithms/FixedWindow.js'
import { SlidingWindow }      from '../src/algorithms/SlidingWindow.js'
import { MemoryStore }        from '../src/stores/MemoryStore.js'
import { byIP }               from '../src/resolvers/byIP.js'

const REFRESH_MS  = 10
const DEMO_IPS    = ['192.168.1.1', '10.0.0.5', '172.16.0.3', '127.0.0.1']
const DEMO_PATHS  = ['/api/hello', '/api/login', '/api/search', '/api/admin/data']
const DEMO_METHOD = ['GET', 'POST', 'GET', 'DELETE']

// ── Collector + Renderer ──────────────────────────────────────────
const collector = new DashboardCollector()
const renderer  = new DashboardRenderer()

// ── Demo limiter (Token Bucket: burst 5, refill 2/sec) ───────────
const limiter = createLimiter({
  algorithm: new TokenBucket({ capacity: 5, refillRate: 2 }),
  store:     new MemoryStore(),
  keyBy:     byIP,
  failOpen:  true,
  onAllowed: (ctx, result) => collector.recordAllowed(ctx),
  onBlocked: (ctx, result) => collector.recordBlocked(ctx, result),
})

// ── Simulate traffic — random bursts every 10–80ms ────────────────
function simulateRequest() {
  const idx    = Math.floor(Math.random() * DEMO_IPS.length)
  const ip     = DEMO_IPS[idx]
  const path   = DEMO_PATHS[idx]
  const method = DEMO_METHOD[idx]

  limiter.check({ ip, path, method, user: null })

  // Schedule next request with variable interval to create burst patterns
  const nextIn = Math.random() < 0.3
    ? Math.floor(Math.random() * 5)    // burst: 0–5ms
    : Math.floor(Math.random() * 80)   // normal: 0–80ms
  setTimeout(simulateRequest, nextIn)
}

// ── Flush bucket every 10ms ───────────────────────────────────────
const flushInterval = setInterval(() => collector.flush(), REFRESH_MS)

// ── Render loop every 10ms ────────────────────────────────────────
let paused = false
const renderInterval = setInterval(() => {
  if (!paused) renderer.render(collector.snapshot())
}, REFRESH_MS)

// ── Keyboard input ────────────────────────────────────────────────
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
}
process.stdin.resume()
process.stdin.setEncoding('utf8')

process.stdin.on('data', (key) => {
  if (key === 'q' || key === '\u0003') {
    cleanup()
  } else if (key === 'r') {
    collector.reset()
  } else if (key === 'p') {
    paused = !paused
    renderer.paused = paused
  }
})

function cleanup() {
  clearInterval(flushInterval)
  clearInterval(renderInterval)
  renderer.cleanup()
  limiter.destroy()
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

// ── Start ─────────────────────────────────────────────────────────
simulateRequest()
