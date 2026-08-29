import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useIsHandheld } from '../hooks/useIsHandheld'
import { downloadFile } from '../lib/pdf'

const MIN_SCALE = 0.5
const MAX_SCALE = 3
const SCALE_STEP = 0.25
/** A page never renders wider than this, however wide the viewport gets. */
const MAX_PAGE_WIDTH = 880

type FileViewerProps = {
  /** Blob URL from fetchDocumentUrl. */
  url: string
  filename: string
  onClose: () => void
}

/**
 * The document, full screen, over a dimmed and blurred portal.
 *
 * A native <dialog> so the focus trap, the inert background and Escape all
 * come from the platform. Unlike the session-timeout dialog, Escape is a
 * legitimate way out here, so it is left alone. No shadow: the overlay covers
 * the viewport, so there is nothing for it to sit above.
 */
export function FileViewer({ url, filename, onClose }: FileViewerProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const pages = useRef<(HTMLDivElement | null)[]>([])
  const handheld = useIsHandheld()

  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [width, setWidth] = useState(MAX_PAGE_WIDTH)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    // showModal makes the background inert but not unscrollable.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
      node?.close()
    }
  }, [])

  useEffect(() => {
    const node = scroller.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.min(entry.contentRect.width - 32, MAX_PAGE_WIDTH)),
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const scrollToPage = useCallback((page: number) => {
    pages.current[page - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={onClose}
      aria-label={filename}
      className={[
        'm-0 h-dvh max-h-none w-dvw max-w-none border-0 bg-transparent p-0 text-white outline-none',
        'backdrop:bg-text/65 backdrop:backdrop-blur-md',
      ].join(' ')}
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-start gap-3 bg-primary-dark/95 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document"
            className={[
              'flex size-11 shrink-0 items-center justify-center rounded-full text-white',
              'transition-colors hover:bg-white/10 outline-none',
              'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2',
              'focus-visible:ring-offset-primary-dark',
            ].join(' ')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Pinch-zoom is the whole interaction on a handheld: no toolbar,
              and no print, which a phone has no sensible answer for anyway. */}
          {handheld ? null : (
            <Toolbar
              url={url}
              filename={filename}
              numPages={numPages}
              scale={scale}
              onScale={setScale}
              onGoToPage={scrollToPage}
            />
          )}

          <p className="min-w-0 flex-1 pt-2 text-right text-sm break-all text-white sm:text-center">
            {filename}
          </p>
        </div>

        <div
          ref={scroller}
          className="flex-1 overflow-auto overscroll-contain px-4 py-6"
          style={{ touchAction: 'pinch-zoom' }}
        >
          {failed ? (
            <p className="mx-auto max-w-[26rem] pt-16 text-center text-white">
              We couldn’t open this document just now. Please close this and try again.
            </p>
          ) : (
            <Document
              file={url}
              onLoadSuccess={(pdf: PDFDocumentProxy) => setNumPages(pdf.numPages)}
              onLoadError={() => setFailed(true)}
              loading={<p className="pt-16 text-center text-white/80">Opening…</p>}
              error={null}
              className="flex flex-col items-center gap-6"
            >
              {Array.from({ length: numPages }, (_, index) => (
                <div
                  key={index}
                  ref={(node) => {
                    pages.current[index] = node
                  }}
                >
                  <Page pageNumber={index + 1} width={width * scale} />
                </div>
              ))}
            </Document>
          )}
        </div>
      </div>
    </dialog>
  )
}

const toolButton = [
  'flex size-9 items-center justify-center rounded-full text-white transition-colors',
  'hover:bg-white/15 outline-none focus-visible:ring-2 focus-visible:ring-white/60',
  'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent',
].join(' ')

type ToolbarProps = {
  url: string
  filename: string
  numPages: number
  scale: number
  onScale: (next: number) => void
  onGoToPage: (page: number) => void
}

function Toolbar({ url, filename, numPages, scale, onScale, onGoToPage }: ToolbarProps) {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<number[] | null>(null)
  const [position, setPosition] = useState(0)

  /**
   * Search resolves to the pages a phrase appears on, and steps between them.
   *
   * Page-level rather than a highlight overlay: it answers "where is this"
   * with the document itself on screen, and needs none of the coordinate
   * mapping a highlight layer would have to keep in step with zoom.
   */
  async function search(event: FormEvent) {
    event.preventDefault()
    const needle = query.trim().toLowerCase()
    if (!needle) return setMatches(null)

    const pdf = await pdfjs.getDocument(url).promise
    const found: number[] = []

    for (let page = 1; page <= pdf.numPages; page += 1) {
      const content = await (await pdf.getPage(page)).getTextContent()
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .toLowerCase()
      if (text.includes(needle)) found.push(page)
    }

    setMatches(found)
    setPosition(0)
    if (found.length > 0) onGoToPage(found[0])
  }

  const step = (delta: number) => {
    if (!matches?.length) return
    const next = (position + delta + matches.length) % matches.length
    setPosition(next)
    onGoToPage(matches[next])
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/25 px-2 py-1">
      <button
        type="button"
        aria-label="Print"
        onClick={() => printPdf(url)}
        disabled={numPages === 0}
        className={toolButton}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
          <path
            d="M7 9V4h10v5M7 19H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 15h10v5H7z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Download"
        onClick={() => downloadFile(url, filename)}
        className={toolButton}
      >
        <DownloadGlyph />
      </button>

      <span aria-hidden="true" className="mx-1 h-5 w-px bg-white/25" />

      <form onSubmit={search} className="flex items-center gap-1">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search this document"
          className={[
            'w-28 rounded-full bg-transparent px-3 py-1.5 text-sm text-white',
            'placeholder:text-white/60 outline-none',
            'focus-visible:ring-2 focus-visible:ring-white/40',
          ].join(' ')}
        />
        <button type="submit" aria-label="Find" className={toolButton}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
            <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="m15.5 15.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </form>

      {matches ? (
        <span aria-live="polite" className="flex items-center gap-1 text-sm text-white">
          {matches.length === 0 ? (
            'No matches'
          ) : (
            <>
              <button type="button" aria-label="Previous match" onClick={() => step(-1)} className={toolButton}>
                ‹
              </button>
              <span className="tabular-nums">
                {position + 1} of {matches.length}
              </span>
              <button type="button" aria-label="Next match" onClick={() => step(1)} className={toolButton}>
                ›
              </button>
            </>
          )}
        </span>
      ) : null}

      <span aria-hidden="true" className="mx-1 h-5 w-px bg-white/25" />

      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => onScale(Math.min(scale + SCALE_STEP, MAX_SCALE))}
        disabled={scale >= MAX_SCALE}
        className={toolButton}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
          <path d="M12 7v10M7 12h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => onScale(Math.max(scale - SCALE_STEP, MIN_SCALE))}
        disabled={scale <= MIN_SCALE}
        className={toolButton}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
          <path d="M7 12h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

/** The row and toolbar share one glyph so they can never drift apart. */
export function DownloadGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Prints through a hidden same-origin iframe, which is why the viewer works
 * from a blob URL rather than the signed one — a cross-origin frame won't let
 * us call its print dialog.
 */
function printPdf(url: string): void {
  const frame = document.createElement('iframe')
  frame.style.position = 'fixed'
  frame.style.right = '100%'
  frame.style.visibility = 'hidden'
  frame.src = url
  frame.onload = () => {
    frame.contentWindow?.addEventListener('afterprint', () => frame.remove())
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
  }
  document.body.append(frame)
}
