import { useEffect, useState } from 'react'

const NARROW = '(max-width: 767px)'
const COARSE_POINTER = '(pointer: coarse)'
const MOBILE_UA = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i

function detect(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia(NARROW).matches ||
    window.matchMedia(COARSE_POINTER).matches ||
    MOBILE_UA.test(navigator.userAgent)
  )
}

/**
 * Whether this is a handheld device, used to decide between the scannable QR
 * code and a one-tap otpauth:// link during authenticator enrollment — you
 * can't scan a QR code with the same phone that's displaying it.
 *
 * Deliberately generous: viewport, pointer type, or user agent is enough. A
 * false positive only costs a desktop user the QR code, and the manual setup
 * key is offered on every device regardless.
 */
export function useIsHandheld(): boolean {
  const [handheld, setHandheld] = useState(detect)

  useEffect(() => {
    const narrow = window.matchMedia(NARROW)
    const coarse = window.matchMedia(COARSE_POINTER)
    const update = () => setHandheld(detect())

    narrow.addEventListener('change', update)
    coarse.addEventListener('change', update)
    return () => {
      narrow.removeEventListener('change', update)
      coarse.removeEventListener('change', update)
    }
  }, [])

  return handheld
}
