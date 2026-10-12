import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Observer } from 'gsap/Observer'
import { useGSAP } from '@gsap/react'
import { couple, nikah, walima } from './content'

gsap.registerPlugin(useGSAP, Observer)

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
    <dl className="countdown" aria-label="Time until the Nikah">
      {units.map(([label, n]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{String(Math.floor(n)).padStart(2, '0')}</dd>
        </div>
      ))}
    </dl>
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
    // The arched card rises into place, its photo uncovers from the bottom, gold rules draw outwards.
    .fromTo(q('.arch'), { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2 }, 0)
    .fromTo(q('.slide-photo'), { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 0 0)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 0 0)', duration: 1.4, ease: 'power3.inOut' }, 0.1)
    .fromTo(q('.slide-photo img'), { scale: 1.2 }, { scale: 1, duration: 2 }, 0.1)
    .fromTo(q('.arabic'), { y: 12, autoAlpha: 0, filter: 'blur(6px)' }, { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 1.2 }, 0.3)
    .fromTo(q('.rule'), { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power2.inOut', stagger: 0.15 }, 0.5)
    .fromTo(q('.reveal'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.9 }, 0.45)
  return tl
}

const SLIDES = [
  ['home', 'Home'],
  ['nikah', 'Nikah'],
  ['walima', 'Walima'],
]

const Rule = () => <span className="rule" aria-hidden="true" />

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
        <div className="letter-overlay green">
          <div className="envelope">
            <div className="env-back" />
            <div className="env-letter">
              <p className="arabic" lang="ar" dir="rtl">{nikah.bismillah}</p>
              <p className="eyebrow">You are invited to the Nikah of</p>
              <p className="script">{names}</p>
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
            <img src={couple.heroPhoto} alt="" fetchPriority="high" />
          </div>
          <div className="hero-copy">
            <h1 className="hero-names script">
              <span className="eyebrow hero-kicker">The Nikah of</span>
              <span>{couple.one}</span>
              <span className="amp">&amp;</span>
              <span>{couple.two}</span>
            </h1>
            <div className="hero-meta">
              <p className="eyebrow">{couple.dateLabel}</p>
              <Countdown />
              <p className="scroll-hint eyebrow">Scroll to continue</p>
            </div>
          </div>
        </header>

        <section className="slide paper" id="nikah">
          <div className="slide-body split">
            <div className="slide-photo">
              <img src={nikah.photo} alt="" />
            </div>
            <article className="arch">
              <p className="arabic" lang="ar" dir="rtl">{nikah.bismillah}</p>
              <h2 className="section-title script">Nikah</h2>
              <p className="name reveal">{nikah.groom}</p>
              <p className="parents reveal">({nikah.groomParents})</p>
              <p className="with script reveal">with</p>
              <p className="name reveal">{nikah.bride}</p>
              <p className="parents reveal">({nikah.brideParents})</p>
              <Rule />
              <p className="date reveal">{nikah.date}</p>
              <p className="hijri reveal">{nikah.hijri}</p>
              <p className="time reveal">{nikah.time}</p>
              <Rule />
              <p className="venue reveal">{nikah.venue}</p>
              <p className="address reveal">{nikah.address}</p>
              <a className="map reveal" href={nikah.map} target="_blank" rel="noreferrer">
                Get directions
              </a>
            </article>
          </div>
        </section>

        <section className="slide paper" id="walima">
          <div className="slide-body split">
            <div className="slide-photo">
              <img src={walima.photo} alt="" />
            </div>
            <article className="arch">
              <p className="arabic" lang="ar" dir="rtl">{walima.verseArabic}</p>
              <p className="verse reveal">
                “{walima.verse}”<span>{walima.verseRef}</span>
              </p>
              <h2 className="section-title script">Walima</h2>
              <p className="name reveal">{walima.names[0]}</p>
              <p className="with script reveal">&amp;</p>
              <p className="name reveal">{walima.names[1]}</p>
              <p className="parents reveal">{walima.line}</p>
              <Rule />
              <p className="eyebrow reveal">{walima.day}</p>
              <p className="date reveal">{walima.date}</p>
              <p className="hijri reveal">{walima.hijri}</p>
              <p className="time reveal">{walima.event}</p>
              <p className="time reveal">{walima.time}</p>
              <Rule />
              <p className="venue reveal">{walima.venue}</p>
              <p className="address reveal">{walima.address}</p>
              <a className="map reveal" href={walima.map} target="_blank" rel="noreferrer">
                Get directions
              </a>
              <p className="blessing reveal">
                <span className="eyebrow">{walima.blessing}</span>
                <span className="script">{walima.family}</span>
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
