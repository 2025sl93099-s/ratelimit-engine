/**
 * @fileoverview Terminal renderer for the live dashboard.
 * Uses ANSI escape codes only — zero dependencies.
 * Redraws the full screen every 10ms via process.stdout.write.
 */

// ── ANSI helpers ──────────────────────────────────────────────────
const ESC   = '\x1b['
const CLEAR = '\x1b[2J\x1b[H'   // clear screen + move cursor to top
const HIDE  = '\x1b[?25l'       // hide cursor
const SHOW  = '\x1b[?25h'       // show cursor

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  blue:    '\x1b[34m',
  white:   '\x1b[37m',
  bgRed:   '\x1b[41m',
  bgGreen: '\x1b[42m',
}

const bold    = (s) => `${C.bold}${s}${C.reset}`
const dim     = (s) => `${C.dim}${s}${C.reset}`
const green   = (s) => `${C.green}${s}${C.reset}`
const red     = (s) => `${C.red}${s}${C.reset}`
const yellow  = (s) => `${C.yellow}${s}${C.reset}`
const cyan    = (s) => `${C.cyan}${s}${C.reset}`
const magenta = (s) => `${C.magenta}${s}${C.reset}`

// ── Sparkline ─────────────────────────────────────────────────────
const SPARK_CHARS = ' ▁▂▃▄▅▆▇█'

function sparkline(values, width = 50) {
  const slice = values.slice(-width)
  const max   = Math.max(...slice, 1)
  return slice
    .map((v) => {
      const idx = Math.round((v / max) * (SPARK_CHARS.length - 1))
      return SPARK_CHARS[idx]
    })
    .join('')
    .padStart(width)
}

// ── Bar ───────────────────────────────────────────────────────────
function bar(value, max, width = 30, color = green) {
  const filled = max > 0 ? Math.round((value / max) * width) : 0
  const empty  = width - filled
  return color('█'.repeat(filled)) + dim('░'.repeat(empty))
}

// ── Format helpers ────────────────────────────────────────────────
function fmtUptime(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  return [
    String(h).padStart(2, '0'),
    String(m % 60).padStart(2, '0'),
    String(s % 60).padStart(2, '0'),
  ].join(':')
}

function fmtTime(ts) {
  return new Date(ts).toISOString().slice(11, 23)  // HH:MM:SS.mmm
}

function pad(s, n) {
  return String(s).slice(0, n).padEnd(n)
}

// ── Box drawing ───────────────────────────────────────────────────
const W = 62   // inner box width

function boxTop(title) {
  const t = title ? ` ${title} ` : ''
  const dashes = '─'.repeat(W - t.length)
  return `  ┌─${t}${dashes}┐`
}

function boxRow(content) {
  const raw   = content.replace(/\x1b\[[0-9;]*m/g, '')  // strip ANSI for length
  const pad   = W - raw.length
  return `  │ ${content}${' '.repeat(Math.max(0, pad - 1))}│`
}

function boxBot() {
  return `  └${'─'.repeat(W + 1)}┘`
}

// ── Main renderer ─────────────────────────────────────────────────
export class DashboardRenderer {
  constructor({ paused = false } = {}) {
    this.paused = paused
  }

  render(snapshot) {
    const { uptime, total, allowed, blocked, sparkline: spark, topIPs, feed } = snapshot
    const blockPct = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0'
    const maxBar   = Math.max(total, 1)
    const lines    = []

    // ── Header ────────────────────────────────────────────────────
    lines.push('')
    lines.push(
      `  ${bold(cyan('⚡ ratelimit-engine'))}  ${dim('Live Dashboard')}` +
      `${' '.repeat(18)}${dim('Refresh: 10ms')}  ${this.paused ? yellow(bold('[PAUSED]')) : ''}`
    )
    lines.push(`  ${dim('─'.repeat(W + 2))}`)
    lines.push(
      `  Uptime: ${bold(fmtUptime(uptime))}` +
      `${' '.repeat(10)}Window: last 200ms` +
      `${' '.repeat(8)}${blocked > allowed ? red('⚠ HIGH BLOCK RATE') : green('● healthy')}`
    )
    lines.push('')

    // ── Traffic panel ─────────────────────────────────────────────
    lines.push(boxTop('Traffic — per 10ms bucket'))
    lines.push(boxRow(`${pad('Total',    9)} ${bar(total,   maxBar, 28, cyan)}   ${bold(pad(total,   5))} req`))
    lines.push(boxRow(`${pad('Allowed',  9)} ${bar(allowed, maxBar, 28, green)}   ${bold(green(pad(allowed, 5)))} req`))
    lines.push(boxRow(`${pad('Blocked',  9)} ${bar(blocked, maxBar, 28, red)}   ${bold(red(pad(blocked, 5)))} req  ${dim(`${blockPct}%`)}`))
    lines.push(boxBot())
    lines.push('')

    // ── Sparkline panel ───────────────────────────────────────────
    lines.push(boxTop('Sparkline — last 2s (200 buckets × 10ms)'))
    lines.push(boxRow(cyan(sparkline(spark, W - 2))))
    lines.push(boxBot())
    lines.push('')

    // ── Top IPs ───────────────────────────────────────────────────
    lines.push(boxTop('Top IPs'))
    if (topIPs.length === 0) {
      lines.push(boxRow(dim('No traffic yet...')))
    } else {
      for (const entry of topIPs) {
        const ipTotal  = entry.allowed + entry.blocked
        const label    = entry.blocked > entry.allowed
          ? red('🔴 high block')
          : green('🟢 normal   ')
        const ipBar    = bar(entry.blocked, Math.max(ipTotal, 1), 12, red)
        lines.push(boxRow(
          `${pad(entry.ip, 16)}  ` +
          `${pad(ipTotal, 5)} req  ` +
          `${red(pad(entry.blocked, 4))} blocked  ` +
          `${ipBar}  ${label}`
        ))
      }
    }
    lines.push(boxBot())
    lines.push('')

    // ── Live feed ─────────────────────────────────────────────────
    lines.push(boxTop('Live Feed'))
    if (feed.length === 0) {
      lines.push(boxRow(dim('Waiting for requests...')))
    } else {
      for (const ev of feed) {
        const status  = ev.allowed ? green('✅ ALLOWED') : red('❌ BLOCKED')
        const ip      = pad(ev.context?.ip ?? 'unknown', 15)
        const method  = pad(ev.context?.method ?? 'GET', 6)
        const path    = pad(ev.context?.path ?? '/', 20)
        const time    = dim(fmtTime(ev.ts))
        lines.push(boxRow(`${time}  ${status}  ${ip} ${method} ${path}`))
      }
    }
    lines.push(boxBot())
    lines.push('')

    // ── Footer ────────────────────────────────────────────────────
    lines.push(`  ${dim('[q]')} quit   ${dim('[r]')} reset counters   ${dim('[p]')} pause/resume`)
    lines.push('')

    process.stdout.write(HIDE + CLEAR + lines.join('\n'))
  }

  cleanup() {
    process.stdout.write(SHOW + '\n')
  }
}
