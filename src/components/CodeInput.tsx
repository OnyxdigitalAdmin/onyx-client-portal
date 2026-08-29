import { Field } from './Field'

export const CODE_LENGTH = 6

/**
 * The 6-digit code field, shared by the emailed sign-in code and the
 * authenticator code so the two steps of signing in look like one sequence.
 *
 * Wide tracking stands in for a monospace family — the system runs on one
 * typeface, so digits are separated by space rather than by a second font.
 */
export function CodeInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <Field
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={CODE_LENGTH}
      autoFocus
      required
      placeholder="000000"
      className="text-center text-2xl tracking-[0.4em] placeholder:tracking-[0.4em]"
    />
  )
}
