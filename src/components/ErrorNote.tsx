import type { ReactNode } from 'react'

/**
 * A real failure, in the Error colour from DESIGN.md.
 *
 * Rendered as a light panel rather than bare text: the Error red only reaches
 * ~2.4:1 against the primary-dark field, but a comfortable 4.8:1 on the light
 * Background token. Red stays reserved for genuine failures — never for
 * routine in-progress state (the No-Alarm Rule).
 */
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-error/35 bg-background px-4 py-3 text-sm leading-snug text-error"
    >
      {children}
    </p>
  )
}
