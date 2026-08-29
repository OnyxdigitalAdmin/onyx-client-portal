import { useEffect, useId, useRef, useState } from 'react'
import triBunnyWhite from '../../brand/logos/tri-bunny-white-transparent.png'

/**
 * The top bar for every authenticated screen: the tri-bunny mark centred, the
 * firm's name beneath it, and the menu at the top right.
 *
 * The white/transparent mark rather than the full-colour square — the default
 * rule for a dark surface in DESIGN.md. That file is trimmed to its artwork
 * (789×634) so it takes none of the square mark's bleed correction.
 */
export type VcisoContact = { name: string | null; contact: string | null }

type PortalHeaderProps = {
  companyName: string
  vciso: VcisoContact
  /** Scrolls the document library into view. */
  onOpenDocuments: () => void
  onSignOut: () => void
}

const menuItem = [
  'block w-full rounded-xl px-4 py-3 text-left text-white transition-colors',
  'hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none',
].join(' ')

export function PortalHeader({
  companyName,
  vciso,
  onOpenDocuments,
  onSignOut,
}: PortalHeaderProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  const close = (run: () => void) => () => {
    setOpen(false)
    run()
  }

  return (
    <header className="bg-primary-dark px-6 pt-6 pb-7">
      {/* Same column as the page beneath, so the menu lands on the document
          library's own right edge rather than out at the viewport's. */}
      <div className="relative mx-auto max-w-2xl">
        <div className="flex flex-col items-center">
          <img
            src={triBunnyWhite}
            alt="Onyx Digital"
            width={789}
            height={634}
            draggable={false}
            className="h-9 w-auto select-none"
          />
          {/* User data, so normal tracking. Long firm names wrap inside the
              column rather than pushing the bar wider — one seed client runs
              to 52 characters. */}
          <p className="mt-3 max-w-[34rem] text-center leading-snug tracking-normal break-words text-white">
            {companyName}
          </p>
        </div>

        {/* Both anchored to the column, not to each other: the panel opens
            clear of the header rather than slicing through a firm name long
            enough to reach it. */}
        <div ref={wrapper}>
          <button
            type="button"
            aria-label="Menu"
            aria-haspopup="true"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((current) => !current)}
            className={[
              'absolute top-0 right-0 flex size-11 items-center justify-center rounded-full',
              'text-white transition-colors hover:bg-white/10 outline-none',
              'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2',
              'focus-visible:ring-offset-primary-dark',
            ].join(' ')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {open ? (
            <div
              id={menuId}
              role="menu"
              // The lighter brand indigo, not the field's own colour: a panel
              // painted the same shade as the page behind it has no edge, and
              // the copy it covers reads through. White on primary is 7.8:1.
              className={[
                'absolute top-full right-0 z-40 mt-2 w-64 rounded-2xl border border-white/20',
                'bg-primary p-2',
              ].join(' ')}
            >
              <button
                type="button"
                role="menuitem"
                className={menuItem}
                onClick={close(onOpenDocuments)}
              >
                Documents
              </button>

              {/* Hidden outright when there is no vCISO on the record — a blank
                  row would read as a missing person rather than an unset field. */}
              {vciso.name ? (
                <div role="menuitem" className="px-4 py-3">
                  {/* The item's own name leads, at the same weight as the two
                      beside it. A small muted "Your vCISO" over a larger name
                      would be an eyebrow, which inverts the hierarchy it is
                      meant to introduce. */}
                  <p className="text-white">Your vCISO</p>
                  <p className="mt-1 text-sm text-white/80">{vciso.name}</p>
                  {vciso.contact ? (
                    vciso.contact.includes('@') ? (
                      <a
                        href={`mailto:${vciso.contact}`}
                        className={[
                          'mt-1 inline-block rounded text-sm text-white underline underline-offset-4',
                          'outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                        ].join(' ')}
                      >
                        {vciso.contact}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-white/80">{vciso.contact}</p>
                    )
                  ) : null}
                </div>
              ) : null}

              <button type="button" role="menuitem" className={menuItem} onClick={close(onSignOut)}>
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
