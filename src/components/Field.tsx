import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

/**
 * A labelled input for the indigo pre-auth screens: transparent fill, thin
 * white rule, pill radius — the form language established in
 * brand/ui-reference/web-form-reference.png.
 *
 * The white opacities are contrast floors, not taste: on primary-dark, /60
 * placeholder text clears 4.5:1 and the /45 rule clears the 3:1 required of a
 * control boundary. Lowering either fails WCAG on this background.
 */
export function Field({ label, className, ...inputProps }: FieldProps) {
  const generatedId = useId()
  const id = inputProps.id ?? generatedId

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-white/85">
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        className={[
          'w-full rounded-full border border-white/45 bg-transparent px-5 py-3',
          'text-white placeholder:text-white/60',
          'transition-colors outline-none',
          'hover:border-white/70',
          'focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/40',
          'disabled:opacity-55',
          className ?? '',
        ].join(' ')}
      />
    </div>
  )
}
