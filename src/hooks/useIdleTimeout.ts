import { useCallback, useEffect, useRef, useState } from 'react'

/** 5 minutes idle, then a 90-second countdown before sign-out (CLAUDE.md). */
export const IDLE_LIMIT_MS = 5 * 60 * 1000
export const COUNTDOWN_MS = 90 * 1000

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'wheel',
  'scroll',
  'touchstart',
] as const

const TICK_MS = 250

type IdleTimeout = {
  /** True once the idle limit is hit and the countdown is running. */
  warning: boolean
  /** Whole seconds left before sign-out. */
  secondsLeft: number
  /** Dismisses the warning and restarts the idle clock. */
  staySignedIn: () => void
}

/**
 * Idle session guard.
 *
 * Once the warning is showing, ordinary activity deliberately does NOT dismiss
 * it — otherwise moving the pointer toward "Stay signed in" would cancel the
 * countdown before it could be read. Only the explicit button clears it.
 */
export function useIdleTimeout(onExpire: () => void): IdleTimeout {
  const [warning, setWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_MS / 1000)

  const lastActivityAt = useRef(Date.now())
  const warningStartedAt = useRef<number | null>(null)
  const expiredRef = useRef(false)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const staySignedIn = useCallback(() => {
    warningStartedAt.current = null
    lastActivityAt.current = Date.now()
    setSecondsLeft(COUNTDOWN_MS / 1000)
    setWarning(false)
  }, [])

  useEffect(() => {
    const noteActivity = () => {
      // Ignored while the countdown is up — see the note above.
      if (warningStartedAt.current !== null) return
      lastActivityAt.current = Date.now()
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, noteActivity, { passive: true })
    }

    const interval = window.setInterval(() => {
      if (expiredRef.current) return
      const now = Date.now()

      if (warningStartedAt.current === null) {
        if (now - lastActivityAt.current >= IDLE_LIMIT_MS) {
          warningStartedAt.current = now
          setSecondsLeft(COUNTDOWN_MS / 1000)
          setWarning(true)
        }
        return
      }

      const remaining = COUNTDOWN_MS - (now - warningStartedAt.current)
      if (remaining <= 0) {
        expiredRef.current = true
        setSecondsLeft(0)
        onExpireRef.current()
        return
      }
      setSecondsLeft(Math.ceil(remaining / 1000))
    }, TICK_MS)

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, noteActivity)
      }
      window.clearInterval(interval)
    }
  }, [])

  return { warning, secondsLeft, staySignedIn }
}
