/* ── Scroll reveal ───────────────────────────────────────────────── */
function initReveal() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  )

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
}

/* ── Scroll progress → CSS var (curriculo.me --p1 pattern) ──────── */
function initScrollProgress() {
  const root = document.documentElement

  const onScroll = () => {
    const max = document.body.scrollHeight - window.innerHeight
    root.style.setProperty('--p1', max > 0 ? (window.scrollY / max).toFixed(4) : '0')
  }

  window.addEventListener('scroll', onScroll, { passive: true })
}

/* ── Sticky nav ──────────────────────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('nav')
  if (!nav) return

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40)
  }, { passive: true })
}

/* ── Active section highlight ────────────────────────────────────── */
function initActiveLinks() {
  const sections = document.querySelectorAll('section[id]')
  const navItems = document.querySelectorAll('.nav__item')

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navItems.forEach((item) => {
            item.classList.toggle(
              'active',
              item.getAttribute('href') === `#${entry.target.id}`
            )
          })
        }
      })
    },
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

  links.querySelectorAll('.nav__item').forEach((item) => {
    item.addEventListener('click', () => {
      links.classList.remove('open')
      burger.classList.remove('open')
      burger.setAttribute('aria-expanded', 'false')
    })
  })

  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('open')
      burger.classList.remove('open')
      burger.setAttribute('aria-expanded', 'false')
    }
  })
}

/* ── Algorithm tabs ──────────────────────────────────────────────── */
function initAlgoTabs() {
  const tabs   = document.querySelectorAll('.algo-tab')
  const panels = document.querySelectorAll('.algo-panel')
  if (!tabs.length) return

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.algo
      tabs.forEach((t)   => t.classList.toggle('active', t === tab))
      panels.forEach((p) => p.classList.toggle('active', p.dataset.algo === key))
    })
  })
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
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el     = entry.target
        const target = parseInt(el.dataset.count, 10)
        const dur    = 1200
        const start  = performance.now()

        const ease = (t) => 1 - Math.pow(1 - t, 3) // ease-out cubic

        const tick = (now) => {
          const raw  = Math.min((now - start) / dur, 1)
          el.textContent = Math.round(ease(raw) * target)
          if (raw < 1) requestAnimationFrame(tick)
        }

        requestAnimationFrame(tick)
        observer.unobserve(el)
      })
    },
    { threshold: 0.5 }
  )

  els.forEach((el) => observer.observe(el))
}

/* ── SVG flowing wires for architecture ──────────────────────────── */
/*
 * Curriculo.me uses animated stroke-dashoffset on SVG paths overlaying
 * its "how it works" diagram. We do the same: after the diagram is in
 * the DOM we measure element positions and draw curved connector paths.
 */
function initArchWires() {
  const svg      = document.getElementById('archWires')
  const diagram  = document.getElementById('archDiagram')
  if (!svg || !diagram) return

  function drawWires() {
    svg.innerHTML = ''

    const base  = diagram.getBoundingClientRect()
    const get   = (id) => {
      const el = document.getElementById(id)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        cx: r.left - base.left + r.width / 2,
        cy: r.top  - base.top  + r.height / 2,
        top:    r.top    - base.top,
        bottom: r.bottom - base.top,
        left:   r.left   - base.left,
        right:  r.right  - base.left,
        w: r.width,
        h: r.height,
      }
    }

    const app     = get('archApp')
    const adapter = get('archAdapter')
    const engine  = get('archEngine')
    const algo    = get('archAlgo')
    const store   = get('archStore')

    if (!app || !adapter || !engine || !algo || !store) return

    svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`)
    svg.style.height = base.height + 'px'

    const makePath = (d, cls) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      p.setAttribute('d', d)
      p.setAttribute('class', `wire ${cls}`)
      svg.appendChild(p)
    }

    // Vertical main spine — app → adapter → engine
    const cx = base.width / 2

    makePath(
      `M ${cx} ${app.bottom} C ${cx} ${app.bottom + 20} ${cx} ${adapter.top - 20} ${cx} ${adapter.top}`,
      ''
    )
    makePath(
      `M ${cx} ${adapter.bottom} C ${cx} ${adapter.bottom + 20} ${cx} ${engine.top - 20} ${cx} ${engine.top}`,
      'wire--fast'
    )

    // Engine → algo (left branch)
    makePath(
      `M ${cx} ${engine.bottom} C ${cx} ${engine.bottom + 30} ${algo.cx} ${algo.top - 30} ${algo.cx} ${algo.top}`,
      'wire--algo'
    )

    // Engine → store (right branch)
    makePath(
      `M ${cx} ${engine.bottom} C ${cx} ${engine.bottom + 30} ${store.cx} ${store.top - 30} ${store.cx} ${store.top}`,
      'wire--store'
    )

    // Side decorative wires from engine edges
    makePath(
      `M ${engine.left} ${engine.cy} C ${engine.left - 40} ${engine.cy} ${engine.left - 40} ${algo.cy} ${algo.right} ${algo.cy}`,
      'wire--algo'
    )
    makePath(
      `M ${engine.right} ${engine.cy} C ${engine.right + 40} ${engine.cy} ${engine.right + 40} ${store.cy} ${store.left} ${store.cy}`,
      'wire--store'
    )
  }

  // Draw on load + resize
  const ro = new ResizeObserver(drawWires)
  ro.observe(diagram)

  // Also draw after reveal animation completes
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      setTimeout(drawWires, 400)
      observer.disconnect()
    }
  }, { threshold: 0.2 })

  observer.observe(diagram)
  drawWires()
}

/* ── Scroll-to-top ───────────────────────────────────────────────── */
function initScrollTop() {
  const btn = document.getElementById('scrollTop')
  if (!btn) return

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500)
  }, { passive: true })

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))
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
  initArchWires()
  initScrollTop()
})
