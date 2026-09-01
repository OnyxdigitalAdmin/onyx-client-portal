import { useEffect, useRef, useState } from 'react'
import {
  SHARE_AUDIENCES,
  SHARE_LINK_DAYS,
  audienceLabel,
  formatExpiry,
  isActive,
  shareUrl,
} from '../lib/documents'
import type { ShareAudience, ShareLinkRow } from '../lib/documents'
import { supabase } from '../lib/supabaseClient'

/** 128 bits of entropy, hex. The link is the credential, so it has to be one. */
const newToken = () => crypto.randomUUID().replaceAll('-', '')

type ShareDialogProps = {
  clientId: string
  onClose: () => void
}

/**
 * Who the documents are for — and nothing else.
 *
 * The client picks an audience; the audience picks the documents. There is no
 * document picker, and no third audience: partner sharing was considered and
 * cut. Links expire on their own after 30 days and can be revoked before that.
 */
export function ShareDialog({ clientId, onClose }: ShareDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [links, setLinks] = useState<ShareLinkRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  useEffect(() => {
    void supabase
      .from('share_links')
      .select('id, token, audience, expires_at, revoked')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setLinks(data ?? []))
  }, [clientId])

  async function generate(audience: ShareAudience) {
    setBusy(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('share_links')
      .insert({ client_id: clientId, audience, token: newToken() })
      .select('id, token, audience, expires_at, revoked')
      .single()

    if (insertError || !data) {
      setError('We couldn’t create that link just now. Please try again.')
    } else {
      setLinks((current) => [data, ...(current ?? [])])
    }
    setBusy(false)
  }

  async function revoke(id: string) {
    const { error: updateError } = await supabase
      .from('share_links')
      .update({ revoked: true })
      .eq('id', id)

    if (updateError) {
      setError('We couldn’t revoke that link just now. Please try again.')
      return
    }
    setLinks((current) =>
      (current ?? []).map((link) => (link.id === id ? { ...link, revoked: true } : link)),
    )
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(shareUrl(token, window.location.origin))
      setCopied(token)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      // Clipboard access can be refused; the link is on screen to copy by hand.
    }
  }

  const active = (links ?? []).filter((link) => isActive(link))

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="share-heading"
      // m-auto, as the session dialog does: Tailwind's preflight zeroes the
      // margin a native <dialog> centres itself with, so without it the modal
      // sits in the top-left corner.
      className={[
        'panel-card m-auto w-[min(30rem,calc(100vw-2rem))] shadow-xl',
        'backdrop:bg-scrim/93',
      ].join(' ')}
    >
      <h2 id="share-heading" className="text-xl">
        Who are these documents for?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-text/70">
        Each choice sends its own set of documents. The link works for {SHARE_LINK_DAYS} days, and
        you can revoke it at any time.
      </p>

      {error ? (
        <p role="alert" className="mt-5 rounded-xl border border-error/35 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      {/* The control is a pill and its description sits on the dialog surface
          beneath it — a bordered panel here would be a card inside a card, and
          a square-cornered button is out of system either way. */}
      <div className="mt-6 space-y-6">
        {SHARE_AUDIENCES.map((audience) => (
          <div key={audience.value}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void generate(audience.value)}
              className={[
                'panel-button w-full',
                'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-primary-dark',
              ].join(' ')}
            >
              {audience.label}
            </button>
            <p className="mt-2 text-sm leading-relaxed text-text/70">{audience.description}</p>
          </div>
        ))}
      </div>

      {active.length > 0 ? (
        <div className="panel-rule mt-7 border-t-[3px] pt-5">
          <h3 className="text-base">Active links</h3>
          <ul className="mt-3 space-y-3">
            {active.map((link) => (
              <li key={link.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="text-text">{audienceLabel(link.audience)}</span>
                <span className="text-text/70">Expires {formatExpiry(link.expires_at)}</span>
                <span className="ms-auto flex gap-3">
                  <button type="button" onClick={() => void copy(link.token)} className={quietAction}>
                    {copied === link.token ? 'Copied' : 'Copy link'}
                  </button>
                  <button type="button" onClick={() => void revoke(link.id)} className={quietAction}>
                    Revoke
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Quiet, not a third primary pill: the two audiences are the decision
          on this screen, and closing without sharing is not an equal action. */}
      <div className="mt-8 text-center">
        <button type="button" onClick={onClose} className={quietAction}>
          Done
        </button>
      </div>
    </dialog>
  )
}

const quietAction = [
  'rounded text-sm text-text/70 underline underline-offset-4 transition-colors',
  'hover:text-text focus-visible:text-text focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  'focus-visible:ring-offset-background',
].join(' ')
