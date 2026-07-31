import { BrandField } from './BrandField'

/**
 * Shown while the second-factor check is in flight: the same static mark on
 * the same field as the launch screen, with no loading bar. Only the text
 * differs, which is the whole point of the sequence.
 */
export function AuthenticatingScreen() {
  return (
    <BrandField>
      <p aria-live="polite" className="mt-8 text-3xl tracking-brand text-white/80">
        Authenticating…
      </p>
    </BrandField>
  )
}
