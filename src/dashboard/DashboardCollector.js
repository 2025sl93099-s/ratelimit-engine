/**
 * @fileoverview In-process event collector for the live dashboard.
 * Receives allowed/blocked events from RateLimiter hooks and
 * maintains a rolling 10ms-bucketed time series.
 */

import { EventEmitter } from 'events'

const HISTORY     = 200  // keep last 200 buckets (2 seconds of sparkline)
const TOP_IPS     = 8    // max IPs shown in top-IPs panel
const FEED_SIZE   = 12   // max rows in live feed

export class DashboardCollector extends EventEmitter {
  constructor() {
    super()
    this._buckets   = []   // rolling array of { ts, allowed, blocked }
    this._ipMap     = new Map()   // ip → { allowed, blocked, lastSeen }
    this._feed      = []          // last N events
    this._startedAt = Date.now()
    this._current   = this._newBucket()
  }

  /** Called by onAllowed hook */
  recordAllowed(context) {
    this._current.allowed++
    this._trackIP(context, true)
    this._pushFeed({ allowed: true, context, ts: Date.now() })
    this.emit('tick')
  }

  /** Called by onBlocked hook */
  recordBlocked(context, result) {
    this._current.blocked++
    this._trackIP(context, false)
    this._pushFeed({ allowed: false, context, result, ts: Date.now() })
    this.emit('tick')
  }

  /** Flush current bucket and start a new one — called every 10ms */
  flush() {
    this._buckets.push(this._current)
    if (this._buckets.length > HISTORY) {
      this._buckets.shift()
    }
    this._current = this._newBucket()
  }

  /** Snapshot for the renderer */
  snapshot() {
    const buckets  = [...this._buckets, this._current]
    const last     = buckets.slice(-20)   // last 200ms window

    const totalAllowed  = last.reduce((s, b) => s + b.allowed, 0)
    const totalBlocked  = last.reduce((s, b) => s + b.blocked, 0)
    const total         = totalAllowed + totalBlocked

    const topIPs = [...this._ipMap.entries()]
      .map(([ip, v]) => ({ ip, ...v }))
      .sort((a, b) => (b.allowed + b.blocked) - (a.allowed + a.blocked))
      .slice(0, TOP_IPS)

    return {
      uptime:    Date.now() - this._startedAt,
      total,
      allowed:   totalAllowed,
      blocked:   totalBlocked,
      sparkline: buckets.map((b) => b.allowed + b.blocked),
      topIPs,
      feed:      [...this._feed],
    }
  }

  reset() {
    this._buckets  = []
    this._ipMap    = new Map()
    this._feed     = []
    this._current  = this._newBucket()
    this._startedAt = Date.now()
  }

  _newBucket() {
    return { ts: Date.now(), allowed: 0, blocked: 0 }
  }

  _trackIP(context, allowed) {
    const ip = context?.ip ?? 'unknown'
    const entry = this._ipMap.get(ip) ?? { allowed: 0, blocked: 0, lastSeen: 0 }
    if (allowed) {
      entry.allowed++
    } else {
      entry.blocked++
    }
    entry.lastSeen = Date.now()
    this._ipMap.set(ip, entry)
  }

  _pushFeed(event) {
    this._feed.unshift(event)
    if (this._feed.length > FEED_SIZE) {
      this._feed.pop()
    }
  }
}
