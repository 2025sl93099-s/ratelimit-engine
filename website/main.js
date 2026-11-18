/* ── Scroll reveal ───────────────────────────────────────────────── */
function initReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return

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

/* ── Sticky nav ──────────────────────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('nav')
  if (!nav) return

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
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

  // Close on nav link click
  links.querySelectorAll('.nav__item').forEach((item) => {
    item.addEventListener('click', () => {
      links.classList.remove('open')
      burger.classList.remove('open')
      burger.setAttribute('aria-expanded', 'false')
    })
  })

  // Close on outside click
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

      tabs.forEach((t) => t.classList.toggle('active', t === tab))
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

        const tick = (now) => {
          const prog = Math.min((now - start) / dur, 1)
          el.textContent = Math.round(prog * target)
          if (prog < 1) requestAnimationFrame(tick)
        }

        requestAnimationFrame(tick)
        observer.unobserve(el)
      })
    },
    { threshold: 0.5 }
  )

  els.forEach((el) => observer.observe(el))
}

/* ── Scroll-to-top button ────────────────────────────────────────── */
function initScrollTop() {
  const btn = document.getElementById('scrollTop')
  if (!btn) return

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500)
  }, { passive: true })

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

/* ── Boot ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initReveal()
  initNav()
  initActiveLinks()
  initHamburger()
  initAlgoTabs()
  initCounters()
  initScrollTop()
})
