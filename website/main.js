/* ── Scroll reveal ───────────────────────────────────────────────── */
function initReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); observer.unobserve(e.target) }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  )
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
}

/* ── Scroll progress → CSS var ───────────────────────────────────── */
function initScrollProgress() {
  const root = document.documentElement
  window.addEventListener('scroll', () => {
    const max = document.body.scrollHeight - window.innerHeight
    root.style.setProperty('--p1', max > 0 ? (window.scrollY / max).toFixed(4) : '0')
  }, { passive: true })
}

/* ── Sticky nav ──────────────────────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('nav')
  if (!nav) return
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40), { passive: true })
}

/* ── Active section highlight ────────────────────────────────────── */
function initActiveLinks() {
  const sections = document.querySelectorAll('section[id]')
  const navItems = document.querySelectorAll('.nav__item')
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        navItems.forEach((item) =>
          item.classList.toggle('active', item.getAttribute('href') === `#${e.target.id}`)
        )
      }
    }),
    { threshold: 0.4 }
  )
  sections.forEach((s) => observer.observe(s))
}

/* ── Mobile hamburger ────────────────────────────────────────────── */
function initHamburger() {
  const burger = document.getElementById('navBurger')
  const links  = document.getElementById('navLinks')
  if (!burger || !links) return

  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open')
    burger.classList.toggle('open', open)
    burger.setAttribute('aria-expanded', String(open))
  })

  links.querySelectorAll('.nav__item').forEach((item) =>
    item.addEventListener('click', () => {
      links.classList.remove('open'); burger.classList.remove('open')
      burger.setAttribute('aria-expanded', 'false')
    })
  )

  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('open'); burger.classList.remove('open')
      burger.setAttribute('aria-expanded', 'false')
    }
  })
}

/* ── Algorithm tabs ──────────────────────────────────────────────── */
function initAlgoTabs() {
  const tabs   = document.querySelectorAll('.algo-tab')
  const panels = document.querySelectorAll('.algo-panel')
  if (!tabs.length) return
  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      const key = tab.dataset.algo
      tabs.forEach((t)   => t.classList.toggle('active', t === tab))
      panels.forEach((p) => p.classList.toggle('active', p.dataset.algo === key))
    })
  )
}

/* ── Copy install command ────────────────────────────────────────── */
function copyInstall() {
  const text = document.getElementById('installCmd')?.textContent ?? 'npm install ratelimit-engine'
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.install-box__copy')
    if (!btn) return
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`
    btn.style.color = 'var(--color-green)'
    setTimeout(() => {
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
      btn.style.color = ''
    }, 2000)
  })
}

/* ── Animated stat counters ──────────────────────────────────────── */
function initCounters() {
  const els = document.querySelectorAll('.stat__num[data-count]')
  if (!els.length) return
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const el = entry.target, target = parseInt(el.dataset.count, 10), dur = 1200, start = performance.now()
      const ease = (t) => 1 - Math.pow(1 - t, 3)
      const tick = (now) => {
        const raw = Math.min((now - start) / dur, 1)
        el.textContent = Math.round(ease(raw) * target)
        if (raw < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      observer.unobserve(el)
    }),
    { threshold: 0.5 }
  )
  els.forEach((el) => observer.observe(el))
}

/* ── Scroll-to-top ───────────────────────────────────────────────── */
function initScrollTop() {
  const btn = document.getElementById('scrollTop')
  if (!btn) return
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500), { passive: true })
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))
}

/* ═══════════════════════════════════════════════════════════════════
   HIW — sticky scroll architecture diagram
   Exact curriculo.me mechanics:
   - Vertical rail scaleY fills as you scroll through steps
   - Each step activates at threshold → step dot/label fade, opacity 1
   - Corresponding node lifts translateY(-12px) scale(1.045)
   - Connecting SVG wire gets is-active → flowing dashoffset animation
   - Engine node gets ag-hub pulse animation when step 2 active
   - Orbit rings appear when engine is active
═══════════════════════════════════════════════════════════════════ */
function initHIW() {
  const layout   = document.getElementById('hiwLayout')
  const steps    = document.querySelectorAll('.hiw-step')
  const railFill = document.getElementById('hiwRailFill')
  const svg      = document.getElementById('hiwSvg')
  const diagram  = document.getElementById('hiwDiagram')
  const orbitA   = diagram?.querySelector('.hiw-orbit--a')
  const orbitB   = diagram?.querySelector('.hiw-orbit--b')

  if (!layout || !steps.length || !svg || !diagram) return

  // Node elements
  const nodes = {
    0: document.getElementById('hnApp'),
    1: document.getElementById('hnAdapter'),
    2: document.getElementById('hnEngine'),
    3: [document.getElementById('hnAlgo'), document.getElementById('hnStore')],
  }

  // Wire IDs we'll create in SVG: key → path element
  const wires      = {}
  const pulseDots  = {}

  /* ── Draw SVG wires after layout ──────────────────────────────── */
  function drawWires() {
    svg.innerHTML = ''
    const base = diagram.getBoundingClientRect()
    if (base.width === 0) return

    const pos = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        cx: r.left - base.left + r.width / 2,
        cy: r.top  - base.top  + r.height / 2,
        top:    r.top    - base.top,
        bottom: r.bottom - base.top,
        left:   r.left   - base.left,
        right:  r.right  - base.left,
      }
    }

    const app     = pos(nodes[0])
    const adapter = pos(nodes[1])
    const engine  = pos(nodes[2])
    const algo    = pos(nodes[3][0])
    const store   = pos(nodes[3][1])
    if (!app || !adapter || !engine || !algo || !store) return

    svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`)

    const addWire = (id, cls, d) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      p.setAttribute('d', d)
      p.setAttribute('class', `hiw-wire ${cls}`)
      svg.appendChild(p)
      wires[id] = p

      // Pulsing dot on wire midpoint
      const g    = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      g.setAttribute('r', '4')
      g.setAttribute('class', 'hiw-pulse-dot')
      svg.appendChild(g)
      pulseDots[id] = { el: g, path: p }
    }

    // App → Adapter
    addWire(0, 'hiw-wire--app',
      `M ${app.cx} ${app.bottom} C ${app.cx} ${app.bottom + 24} ${adapter.cx} ${adapter.top - 24} ${adapter.cx} ${adapter.top}`)

    // Adapter → Engine
    addWire(1, 'hiw-wire--adapter',
      `M ${adapter.cx} ${adapter.bottom} C ${adapter.cx} ${adapter.bottom + 24} ${engine.cx} ${engine.top - 24} ${engine.cx} ${engine.top}`)

    // Engine → Algo
    addWire(2, 'hiw-wire--algo',
      `M ${engine.cx} ${engine.bottom} C ${engine.cx} ${engine.bottom + 32} ${algo.cx} ${algo.top - 32} ${algo.cx} ${algo.top}`)

    // Engine → Store
    addWire(3, 'hiw-wire--store',
      `M ${engine.cx} ${engine.bottom} C ${engine.cx} ${engine.bottom + 32} ${store.cx} ${store.top - 32} ${store.cx} ${store.top}`)
  }

  /* ── Activate step ────────────────────────────────────────────── */
  let currentStep = -1

  function activateStep(idx) {
    if (idx === currentStep) return
    currentStep = idx

    // Steps
    steps.forEach((s, i) => s.classList.toggle('is-active', i === idx))

    // Rail fill — scaleY proportional to step
    if (railFill) {
      const progress = steps.length > 1 ? idx / (steps.length - 1) : 1
      railFill.style.transform = `scaleY(${progress})`
    }

    // Nodes — deactivate all first
    Object.values(nodes).flat().filter(Boolean).forEach((n) => n.classList.remove('is-active'))

    // Activate nodes for this step
    const toActivate = Array.isArray(nodes[idx]) ? nodes[idx] : [nodes[idx]]
    toActivate.filter(Boolean).forEach((n) => n.classList.add('is-active'))

    // Also keep engine active for steps 2 and 3
    if (idx >= 2 && nodes[2]) nodes[2].classList.add('is-active')

    // Wires — deactivate all
    Object.values(wires).forEach((w) => w.classList.remove('is-active'))
    Object.values(pulseDots).forEach(({ el }) => el.classList.remove('is-active'))

    // Activate wires up to current step
    for (let i = 0; i <= idx && i <= 3; i++) {
      if (wires[i]) {
        wires[i].classList.add('is-active')
        // Position pulse dot at midpoint of path
        const pd = pulseDots[i]
        if (pd) {
          try {
            const len = pd.path.getTotalLength()
            const pt  = pd.path.getPointAtLength(len * 0.5)
            pd.el.setAttribute('cx', pt.x)
            pd.el.setAttribute('cy', pt.y)
            pd.el.setAttribute('fill', getWireColor(i))
            pd.el.classList.add('is-active')
          } catch (_) {}
        }
      }
    }

    // Orbits appear when engine is active (step ≥ 2)
    if (orbitA) orbitA.classList.toggle('is-live', idx >= 2)
    if (orbitB) orbitB.classList.toggle('is-live', idx >= 2)
  }

  function getWireColor(i) {
    return ['rgba(96,165,250,1)', 'rgba(74,222,128,1)', 'rgba(251,191,36,1)', 'rgba(251,113,133,1)'][i] ?? 'rgba(124,106,247,1)'
  }

  /* ── Scroll driver — exact curriculo.me rail scaleY pattern ──── */
  function onScroll() {
    const stepsEl = document.getElementById('hiwSteps')
    if (!stepsEl) return

    const scrollY = window.scrollY
    let activeIdx = 0

    steps.forEach((step, i) => {
      const rect = step.getBoundingClientRect()
      // Step becomes active when its top is above 55% of viewport height
      if (rect.top < window.innerHeight * 0.55) activeIdx = i
    })

    activateStep(activeIdx)
  }

  /* ── Init ─────────────────────────────────────────────────────── */
  const ro = new ResizeObserver(() => { drawWires(); onScroll() })
  ro.observe(diagram)

  // Draw after section enters view
  const sectionObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      setTimeout(() => { drawWires(); onScroll() }, 100)
    }
  }, { threshold: 0.05 })

  const section = document.getElementById('architecture') || document.getElementById('hiw')
  if (section) sectionObserver.observe(section)

  window.addEventListener('scroll', onScroll, { passive: true })
  drawWires()
  activateStep(0)
}

/* ── Boot ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress()
  initReveal()
  initNav()
  initActiveLinks()
  initHamburger()
  initAlgoTabs()
  initCounters()
  initHIW()
  initScrollTop()
})
