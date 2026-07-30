import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** 'solid' sits on the indigo field; 'quiet' is a low-emphasis text action. */
  variant?: 'solid' | 'quiet'
}

/**
 * Pill button, matching the brand form reference. The solid variant is the
 * lighter Primary on the primary-dark field — white on Primary clears 7.8:1.
 */
export function Button({ variant = 'solid', className, ...buttonProps }: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center rounded-full px-6 py-3',
    'transition-colors outline-none',
    'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2',
    'focus-visible:ring-offset-primary-dark',
    'disabled:cursor-not-allowed disabled:opacity-55',
  ].join(' ')

  const variants = {
    solid: 'bg-primary text-white hover:bg-primary/85 disabled:hover:bg-primary',
    quiet: 'px-0 py-1 text-sm text-white/70 underline underline-offset-4 hover:text-white',
  }

  return <button {...buttonProps} className={[base, variants[variant], className ?? ''].join(' ')} />
}
