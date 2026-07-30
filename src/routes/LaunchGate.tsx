import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND_MARK_SRC, BrandField } from '../components/BrandField'
import { supabase } from '../lib/supabaseClient'

/** The bar always takes at least this long, so a warm cache doesn't flash it. */
const MIN_FILL_MS = 900
/** A beat at 100% so the bar is seen completing rather than vanishing. */
const HOLD_AT_FULL_MS = 220
/** Real work is capped here; the last tenth is reserved for actual completion. */
const PRE_COMPLETE_CEILING = 0.9

const FONT_FAMILY = '"Shree Devanagari 714"'

function decodeBrandMark(): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => resolve()
    image.src = BRAND_MARK_SRC
    // decode() resolves once the bitmap is actually ready to paint, not merely
    // downloaded — which is what "loaded" has to mean for the mark behind it.
    void image.decode().then(resolve, () => resolve())
  })
}

/**
 * The launch screen: the static mark on the brand field with a thin bar
 * filling left to right near the bottom.
 *
 * The bar tracks real work — the brand font, the mark's bitmap, and restoring
 * any stored Supabase session — rather than counting down a fake timer. An
 * elapsed-time floor keeps it moving when all three resolve instantly.
 */
export default function LaunchGate() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)

  const settledFraction = useRef(0)
  const allSettled = useRef(false)
  const destination = useRef('/login')
  const navigated = useRef(false)

  useEffect(() => {
    let cancelled = false

    const tasks: Promise<unknown>[] = [
      Promise.all([
        document.fonts.load(`400 1rem ${FONT_FAMILY}`),
        document.fonts.load(`700 1rem ${FONT_FAMILY}`),
      ]),
      decodeBrandMark(),
      supabase.auth.getSession().then(({ data }) => {
        // A restored session still has to clear MFA before it counts, so it
        // goes to /mfa — which sends it straight on if it's already at aal2.
        destination.current = data.session ? '/mfa' : '/login'
      }),
    ]

    let settled = 0
    for (const task of tasks) {
      void task.catch(() => undefined).then(() => {
        if (cancelled) return
        settled += 1
        settledFraction.current = settled / tasks.length
      })
    }

    void Promise.allSettled(tasks).then(() => {
      if (!cancelled) allSettled.current = true
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const start = performance.now()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frameId = 0
    let timeoutId = 0
    let current = 0

    const frame = (now: number) => {
      const elapsed = now - start
      const floor = Math.min(elapsed / MIN_FILL_MS, 1) * PRE_COMPLETE_CEILING
      const complete = allSettled.current && elapsed >= MIN_FILL_MS
      const target = complete
        ? 1
        : Math.max(floor, settledFraction.current * PRE_COMPLETE_CEILING)

      // The bar is a progress indicator, not decoration, so it still fills
      // under reduced motion — it just stops easing between values.
      current = reduceMotion ? target : current + (target - current) * 0.14
      if (target - current < 0.005) current = target
      setProgress(current)

      if (complete && current >= 1 && !navigated.current) {
        navigated.current = true
        timeoutId = window.setTimeout(
          () => navigate(destination.current, { replace: true }),
          HOLD_AT_FULL_MS,
        )
        return
      }

      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
    }
  }, [navigate])

  return (
    <BrandField
      footer={
        <div
          role="progressbar"
          aria-label="Loading the Onyx Digital client portal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-0.5 w-full max-w-[22.5rem] overflow-hidden rounded-full bg-white/20"
        >
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      }
    />
  )
}
