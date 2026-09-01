import { useEffect, useState } from 'react'
import fileShareIcon from '../assets/file-share-icon.png'
import folderIcon from '../assets/folder-icon.png'
import phoneMockup from '../assets/Iphone_mockup.png'

const ADVANCE_MS = 5000

const SLIDES = [
  {
    text: 'Access your compliance documentation from one place.',
    image: folderIcon,
    /** Decorative: the sentence beside it already says what it depicts. */
    className: 'w-[290px]',
  },
  {
    text: 'Securely share documents with your regulators and insurers.',
    image: fileShareIcon,
    className: 'w-[356px]',
  },
  {
    text: 'Monitor your security & compliance posture from one dashboard.',
    image: phoneMockup,
    className: 'w-56',
  },
]

/**
 * The right panel of the sign-in screen.
 *
 * Advances on its own every five seconds, and stops the moment the client
 * shows any interest — hover, focus, or a tap on a dot — because a slide that
 * moves while you are reading it is a worse slide. Under reduced motion it
 * never auto-advances at all: the dots become the only way through, which is
 * information preserved rather than information removed.
 */
export function LoginCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % SLIDES.length),
      ADVANCE_MS,
    )
    return () => window.clearInterval(timer)
  }, [paused])

  const slide = SLIDES[index]

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-14 bg-white px-12 py-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* No aria-live: content that rotates on a timer must not interrupt a
          screen reader every five seconds. The dots below carry the state. */}
      <div
        aria-roledescription="carousel"
        aria-label="What the portal does"
        className="flex w-full max-w-3xl items-center justify-center gap-10"
      >
        <p className="max-w-[13ch] text-4xl leading-[1.3] text-primary-dark">{slide.text}</p>
        <img src={slide.image} alt="" aria-hidden="true" className={slide.className} />
      </div>

      <div className="flex gap-3">
        {SLIDES.map((entry, slideIndex) => (
          <button
            key={entry.text}
            type="button"
            aria-label={`Slide ${slideIndex + 1} of ${SLIDES.length}`}
            aria-current={slideIndex === index}
            onClick={() => {
              setPaused(true)
              setIndex(slideIndex)
            }}
            className={[
              'h-2.5 w-9 rounded-full border border-primary-dark transition-colors',
              'outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              slideIndex === index ? 'bg-primary-dark' : 'bg-transparent hover:bg-primary/20',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  )
}
