import type { CSSProperties, ReactNode } from 'react'
import brandMark from '../../brand/logos/tri-bunny-logo-onyx-digital.png'

export const BRAND_MARK_SRC = brandMark

/**
 * The mark's artwork sits inside a lot of same-coloured padding: the three
 * bunnies occupy only the middle 43.8% × 35.2% of the 2500px square, dead
 * centred. Laid out raw, the image box runs far past what you can see, and
 * spacing beneath it lands roughly 120px lower than it reads.
 *
 * These ratios pull the box back to the visible artwork, so ordinary spacing
 * utilities measure from the bunnies rather than from the invisible edge.
 */
const CONTENT_WIDTH_RATIO = 1094 / 2500
const CONTENT_HEIGHT_RATIO = 880 / 2500
const BLEED_X = (1 - CONTENT_WIDTH_RATIO) / 2
const BLEED_Y = (1 - CONTENT_HEIGHT_RATIO) / 2

/** Sized so the visible artwork lands near 200px full / 96px compact. */
const FULL_SIZE = 'clamp(300px, 34vw, 460px)'
const COMPACT_SIZE = 'clamp(180px, 16vw, 220px)'

const markStyle = (size: string): CSSProperties => ({
  width: size,
  height: size,
  marginBlock: `calc(${size} * ${-BLEED_Y})`,
  marginInline: `calc(${size} * ${-BLEED_X})`,
})

type BrandFieldProps = {
  /** Content directly beneath the mark. */
  children?: ReactNode
  /** Pinned near the bottom, out of the centred column's flow. */
  footer?: ReactNode
  /** Renders the mark smaller, for screens that carry a form as well. */
  compact?: boolean
}

/**
 * The shared brand field: the static tri-bunny mark on solid primary-dark.
 *
 * The launch, authenticating, and welcome screens all render this with nothing
 * changed but their text — no motion anywhere, per CLAUDE.md. Keeping the mark
 * in one component is what guarantees it lands in the same place on each, so
 * moving between them reads as text changing rather than a page swapping.
 *
 * The PNG has primary-dark baked into its own background, matching the field
 * exactly, so it composites seamlessly with no visible edge at any size.
 */
export function BrandField({ children, footer, compact = false }: BrandFieldProps) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-primary-dark">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <img
          src={brandMark}
          alt="Onyx Digital"
          draggable={false}
          style={markStyle(compact ? COMPACT_SIZE : FULL_SIZE)}
          className="max-w-none shrink-0 select-none"
        />
        {children}
      </div>

      {footer ? (
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-6 pb-14 sm:pb-16">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
