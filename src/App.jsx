import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Observer } from 'gsap/Observer'
import { useGSAP } from '@gsap/react'
import { couple, story, events, rsvp } from './content'

gsap.registerPlugin(useGSAP, Observer)

// Jagged top/bottom edges for the torn-paper cards. Seeded so each card keeps its shape across renders.
function torn(seed) {
  let s = seed
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const edge = (y, dir) =>
    Array.from({ length: 25 }, (_, i) => `${i * (100 / 24)}% ${y + dir * rand() * 5}%`)
  return `polygon(${[...edge(1, 1), ...edge(99, -1).reverse()].join(',')})`
}

function Countdown() {
  const target = new Date(couple.date).getTime()
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const left = Math.max(0, target - now)
  if (!left) return <p className="countdown-done">Just married!</p>

  const units = [
    ['Days', left / 864e5],
    ['Hours', (left / 36e5) % 24],
    ['Minutes', (left / 6e4) % 60],
    ['Seconds', (left / 1e3) % 60],
  ]
  return (
    <dl className="countdown" aria-label="Time until the wedding">
      {units.map(([label, n]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{String(Math.floor(n)).padStart(2, '0')}</dd>
        </div>
      ))}
    </dl>
  )
}

function Lace() {
  // Scalloped doily ring drawn around the story photo.
  return (
    <svg className="lace" viewBox="0 0 200 200" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2
        return <circle key={i} cx={100 + 90 * Math.cos(a)} cy={100 + 90 * Math.sin(a)} r="8.5" />
      })}
      <circle cx="100" cy="100" r="88" />
      <circle cx="100" cy="100" r="82" className="lace-line" />
      <circle cx="100" cy="100" r="77" className="lace-dots" />
    </svg>
  )
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Entrance played every time a slide comes into view. Selectors that don't exist on a slide are skipped.
function enter(slide) {
  const q = gsap.utils.selector(slide)
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.1 } })
  tl.fromTo(q('.hero-media'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut' }, 0)
    .fromTo(q('.hero-media img'), { scale: 1.2 }, { scale: 1, duration: 2 }, 0)
    .fromTo(q('.hero-names > *, .hero-meta > *'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08 }, 0.5)
    // Script headings "write" themselves left to right.
    .fromTo(q('.section-title'), { clipPath: 'inset(-30% 100% -30% -5%)' }, { clipPath: 'inset(-30% -5% -30% -5%)', duration: 1.3, ease: 'power2.inOut' }, 0)
    .fromTo(q('.lace'), { rotation: -60, scale: 0.92, autoAlpha: 0 }, { rotation: 0, scale: 1, autoAlpha: 1, duration: 1.6 }, 0)
    .fromTo(q('.story-photo'), { scale: 0.85, autoAlpha: 0 }, { scale: 1, autoAlpha: 1 }, 0.15)
    .fromTo(q('.reveal'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.9 }, 0.25)
  // Paper cards drop in from alternating tilts.
  q('.card').forEach((card, i) =>
    tl.fromTo(card, { y: 70, rotation: i % 2 ? 3 : -3, autoAlpha: 0 }, { y: 0, rotation: 0, autoAlpha: 1 }, 0.3 + i * 0.1),
  )
  return tl
}

const SLIDES = [
  ['home', 'Home'],
  ['story', 'Our Story'],
  ['details', 'The Details'],
  ['rsvp', 'RSVP'],
]

export default function App() {
  const root = useRef(null)
  const goto = useRef(() => {})
  const [opened, setOpened] = useState(false)
  const [active, setActive] = useState(0)

  const { contextSafe } = useGSAP(
    () => {
      const slides = gsap.utils.toArray('.slide')
      const entrances = new Map()
      let current = -1
      let busy = false
      let pos = 0 // where the current slide is scrolling to
      gsap.set(slides, { autoAlpha: 0 })

      function show(i, byScroll) {
        i = gsap.utils.clamp(0, slides.length - 1, i)
        if (i === current || busy) return
        const dir = i > current ? 1 : -1
        const next = slides[i]
        const prev = slides[current]
        // Scrolling back up into a long slide lands on its bottom, like normal scrolling would.
        next.scrollTop = byScroll && dir < 0 ? next.scrollHeight : 0
        gsap.killTweensOf(next, 'scrollTop')
        pos = next.scrollTop
        gsap.set(next, { autoAlpha: 1, zIndex: 2 })
        if (prev) gsap.set(prev, { zIndex: 1 })
        current = i
        setActive(i)

        entrances.get(next)?.kill()
        if (reduceMotion()) {
          gsap.fromTo(next, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 })
          if (prev) gsap.set(prev, { autoAlpha: 0 })
          return
        }
        // Input is locked only while the slides move; the content entrance keeps playing after.
        if (prev) {
          busy = true
          gsap
            .timeline({
              defaults: { duration: 1, ease: 'power3.inOut' },
              onComplete: () => {
                gsap.set(prev, { autoAlpha: 0, yPercent: 0, scale: 1 })
                busy = false
              },
            })
            .fromTo(next, { yPercent: 100 * dir }, { yPercent: 0 }, 0)
            .to(prev, { yPercent: -30 * dir, scale: 0.95 }, 0)
        }
        entrances.set(next, enter(next).delay(prev ? 0.45 : 0))
      }

      // Inside a slide taller than the screen, input scrolls the slide; at its edge it turns the page.
      const max = (el) => el.scrollHeight - el.clientHeight
      const atEdge = (dir, at = slides[current].scrollTop) =>
        dir > 0 ? at >= max(slides[current]) - 2 : at <= 2

      // Wheel/trackpad: native scrolling is blocked and replaced with an eased scroll, so momentum
      // can never leak into the next slide. One gesture either scrolls inside OR turns one page,
      // and a gesture lasts until input pauses (onStop), which swallows trackpad momentum.
      let flipped = false
      let scrolledInside = false
      function wheel(dy) {
        if (current < 0 || busy || flipped || !dy) return
        const dir = Math.sign(dy)
        const el = slides[current]
        if (!gsap.isTweening(el)) pos = el.scrollTop // resync after touch scrolling
        if (!atEdge(dir, pos)) {
          pos = gsap.utils.clamp(0, max(el), pos + dy)
          gsap.to(el, { scrollTop: pos, duration: 0.6, ease: 'power3.out', overwrite: true })
          scrolledInside = true
        } else if (!scrolledInside) {
          flipped = true
          show(current + dir, true)
        }
      }
      const wheelObserver = Observer.create({
        target: window,
        type: 'wheel',
        preventDefault: true,
        onStopDelay: 0.18,
        onStop: () => (flipped = scrolledInside = false),
        onChangeY: (self) => wheel(self.deltaY),
      })

      // Touch: native scrolling (with its own momentum) stays. A swipe turns the page only if the
      // slide was already at that edge when the finger went down.
      let edgeAtPress = { 1: true, [-1]: true }
      const swipe = (dir) => !busy && edgeAtPress[dir] && show(current + dir, true)
      const touchObserver = Observer.create({
        target: window,
        type: 'touch',
        tolerance: 12,
        onPress: () => (edgeAtPress = { 1: atEdge(1), [-1]: atEdge(-1) }),
        onUp: () => swipe(1),
        onDown: () => swipe(-1),
      })
      const observers = [wheelObserver, touchObserver]
      observers.forEach((o) => o.disable())

      function onKey(e) {
        if (current < 0 || busy) return
        const dir = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }[e.key]
        if (!dir) return
        e.preventDefault()
        const el = slides[current]
        if (!gsap.isTweening(el)) pos = el.scrollTop
        if (atEdge(dir, pos)) return show(current + dir, true)
        pos = gsap.utils.clamp(0, max(el), pos + dir * el.clientHeight * 0.7)
        gsap.to(el, { scrollTop: pos, duration: 0.6, ease: 'power3.out', overwrite: true })
      }
      window.addEventListener('keydown', onKey)

      goto.current = (i) => {
        observers.forEach((o) => o.enable())
        show(i)
      }
      return () => {
        observers.forEach((o) => o.kill())
        window.removeEventListener('keydown', onKey)
      }
    },
    { scope: root },
  )

  const openLetter = contextSafe(() => {
    const done = () => setOpened(true)
    if (reduceMotion()) {
      goto.current(0)
      gsap.to('.letter-overlay', { autoAlpha: 0, duration: 0.4, onComplete: done })
      return
    }
    const letter = document.querySelector('.env-letter')
    let box
    gsap
      .timeline({ onComplete: done })
      // The seal gives a little under the press, then breaks away.
      .to('.seal', { scale: 0.9, duration: 0.12, ease: 'power2.out' })
      .to('.seal', { scale: 1.25, rotation: 12, autoAlpha: 0, duration: 0.45, ease: 'power2.out' })
      .to('.seal-hint', { autoAlpha: 0, duration: 0.3 }, '<')
      .to('.env-flap', { rotationX: 180, transformPerspective: 2500, duration: 0.85, ease: 'power2.inOut' }, '-=0.2')
      .set('.env-flap', { zIndex: 1 }, '-=0.42')
      .to(letter, { yPercent: -55, duration: 1, ease: 'power3.out' }, '-=0.15')
      // Hold so the invitation can be read, then the envelope drops away and the letter
      // grows to fill the screen. It is the same cream as the home page, so it becomes the page.
      .add(() => (box = letter.getBoundingClientRect()), '+=1')
      .to('.env-back, .env-front, .env-flap', { y: '75vh', duration: 1, ease: 'power3.inOut' })
      .to('.env-letter > *', { autoAlpha: 0, duration: 0.4, ease: 'power1.out' }, '<')
      .to(letter, {
        y: () => innerHeight / 2 - (box.top + box.height / 2),
        scale: () => Math.max(innerWidth / box.width, innerHeight / box.height) * 1.08,
        boxShadow: 'none',
        duration: 1.1,
        ease: 'power3.inOut',
      }, '<0.1')
      .add(() => {
        gsap.set('.letter-overlay', { autoAlpha: 0 })
        goto.current(0)
      })
  })

  const names = `${couple.one} & ${couple.two}`

  return (
    <div ref={root}>
      {!opened && (
        <div className="letter-overlay wine">
          <div className="envelope">
            <div className="env-back" />
            <div className="env-letter">
              <p className="eyebrow">Together with their families</p>
              <p className="script">{names}</p>
              <p className="eyebrow">invite you to celebrate their wedding</p>
              <p className="env-date">{couple.dateLabel}</p>
            </div>
            <div className="env-front" />
            <div className="env-flap" />
            <button className="seal script" onClick={openLetter} autoFocus aria-label="Open the invitation">
              {couple.one[0]}&amp;{couple.two[0]}
            </button>
          </div>
          <p className="seal-hint eyebrow">Tap the seal to open</p>
        </div>
      )}

      <nav className="nav" aria-label="Sections">
        {SLIDES.map(([id, label], i) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === i ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault()
              goto.current(i)
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      <main className="stage">
        <header className="slide hero" id="home">
          <div className="hero-media">
            <img src={couple.heroPhoto} alt={names} fetchPriority="high" />
          </div>
          <div className="hero-copy">
            <h1 className="hero-names script">
              <span>{couple.one}</span>
              <span className="amp">&amp;</span>
              <span>{couple.two}</span>
            </h1>
            <div className="hero-meta">
              <p className="eyebrow">
                {couple.dateLabel} · {couple.place}
              </p>
              <Countdown />
              <p className="scroll-hint eyebrow">Scroll to continue</p>
            </div>
          </div>
        </header>

        <section className="slide wine" id="story">
          <div className="slide-body">
            <h2 className="section-title script">How We Got Here</h2>
            <div className="story-frame">
              <Lace />
              <img className="story-photo" src={story.photo} alt="" />
            </div>
            <div className="story-text">
              {story.paragraphs.map((p) => (
                <p className="reveal" key={p.slice(0, 20)}>
                  {p}
                </p>
              ))}
              <p className="reveal sign-off">
                <span className="eyebrow">With love</span>
                <span className="script">{names}</span>
              </p>
            </div>
          </div>
        </section>

        <section className="slide paper" id="details">
          <div className="slide-body">
            <h2 className="section-title script">The Details</h2>
            <p className="lede reveal">A few details to help you settle in, slow down, and enjoy every moment with us.</p>
            <ol className="cards">
              {events.map((e, i) => (
                <li className={`card ${i % 2 ? 'card-red' : ''}`} key={e.title} style={{ clipPath: torn(i * 97 + 13) }}>
                  <h3>{e.title}</h3>
                  <p className="card-time">{e.time}</p>
                  <p className="card-place">{e.place}</p>
                  <p className="card-note">{e.note}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="slide wine rsvp" id="rsvp">
          <div className="rsvp-photo">
            <img src={rsvp.photo} alt="" />
          </div>
          <div className="slide-body">
            <h2 className="section-title script">Kindly RSVP</h2>
            <p className="eyebrow reveal">Are you joining us?</p>
            <p className="reveal">
              We hope you’ll be there when we promise our forever.
              <br />
              <strong>Please reply by {rsvp.deadline}</strong>
            </p>
          </div>
          <footer className="footer">
            <p className="script">{names}</p>
            <p className="eyebrow">{couple.dateLabel}</p>
          </footer>
        </section>
      </main>
    </div>
  )
}
