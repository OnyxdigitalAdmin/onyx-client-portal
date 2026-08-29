import { useEffect, useState } from 'react'
import { Document, Page } from 'react-pdf'
import { DownloadGlyph, FileViewer } from './FileViewer'
import { ShareDialog } from './ShareDialog'
import { acknowledgmentText, buildLibrary, canShare } from '../lib/documents'
import type { LibraryDocument, LibraryDocumentRow } from '../lib/documents'
import { documentFilename, downloadFile, fetchDocumentUrl } from '../lib/pdf'

export const LIBRARY_ANCHOR_ID = 'document-library'

type DocumentLibraryProps = {
  documents: LibraryDocumentRow[]
  companyName: string
  clientId: string
  role: string | null
}

/**
 * The file cabinet: a numbered list on the brand field, one row open at a time.
 *
 * Rows are the whole navigation. Opening a second closes the first, so the list
 * never becomes a wall of expanded detail — which is the point of a cabinet.
 */
export function DocumentLibrary({
  documents,
  companyName,
  clientId,
  role,
}: DocumentLibraryProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const library = buildLibrary(documents)

  return (
    <section id={LIBRARY_ANCHOR_ID} className="scroll-mt-4">
      <div className="flex items-start justify-between gap-4 px-6 pb-6">
        <h2 className="text-3xl leading-tight tracking-brand text-white">
          Document
          <br />
          Library.
        </h2>

        {/* Visible only to the two sharing roles. The database enforces the
            same rule in RLS — this only spares everyone else a dead control. */}
        {canShare(role) ? (
          <button
            type="button"
            aria-label="Share documents"
            onClick={() => setSharing(true)}
            className={[
              'flex h-11 w-20 shrink-0 items-center justify-center rounded-full bg-primary',
              'text-white transition-colors hover:bg-primary/85 outline-none',
              'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2',
              'focus-visible:ring-offset-primary-dark',
            ].join(' ')}
          >
            {/* A share glyph, not a plus: a plus reads as "add a document",
                and clients never upload. */}
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
              <circle cx="18" cy="5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="6" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="18" cy="19" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="m8.4 10.8 7.2-4.2m0 10.8-7.2-4.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>

      {library.length === 0 ? (
        <p className="border-t border-white/30 px-6 py-8 text-white/80">
          Your document library is ready. Documents will appear here as we complete and deliver
          them.
        </p>
      ) : (
        <ul className="border-t border-white/30">
          {library.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              companyName={companyName}
              open={openId === doc.id}
              onToggle={() => setOpenId((current) => (current === doc.id ? null : doc.id))}
            />
          ))}
        </ul>
      )}

      {sharing ? <ShareDialog clientId={clientId} onClose={() => setSharing(false)} /> : null}
    </section>
  )
}

function DocumentRow({
  doc,
  companyName,
  open,
  onToggle,
}: {
  doc: LibraryDocument
  companyName: string
  open: boolean
  onToggle: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [viewing, setViewing] = useState(false)
  const filename = documentFilename(companyName, doc.name)

  // Only the open row loads its file. At most one row is open, so the library
  // never holds more than one document in memory.
  useEffect(() => {
    if (!open || !doc.storagePath) return

    let objectUrl: string | null = null
    fetchDocumentUrl(doc.storagePath).then(
      (result) => {
        objectUrl = result
        setUrl(result)
      },
      () => setUrl(null),
    )

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setUrl(null)
    }
  }, [open, doc.storagePath])

  return (
    <li className="border-b border-white/30">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={[
          'flex w-full items-baseline gap-6 px-6 py-4 text-left text-white transition-colors',
          'hover:bg-white/[0.06] outline-none focus-visible:bg-white/[0.06]',
          'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60',
        ].join(' ')}
      >
        <span className="w-8 shrink-0 tabular-nums text-white/80">
          {String(doc.number).padStart(2, '0')}.
        </span>
        <span className="flex-1">{doc.name}</span>
      </button>

      {open ? (
        <div className="flex flex-wrap items-start gap-6 px-6 pt-1 pb-7 sm:flex-nowrap sm:ps-20">
          {/* No file, no thumbnail: a blank white rectangle where a first page
              should be reads as a broken document rather than a pending one. */}
          {doc.storagePath ? (
            <div className="aspect-[8.5/11] w-28 shrink-0 overflow-hidden rounded-sm bg-white">
              {url ? (
                <Document file={url} loading={null} error={null}>
                  <Page
                    pageNumber={1}
                    width={112}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              ) : null}
            </div>
          ) : null}

          <dl className="min-w-0 flex-1 space-y-1.5 text-sm text-white">
            <div className="flex gap-2">
              <dt className="text-white/80">Date Created:</dt>
              <dd>{doc.createdOn ?? '—'}</dd>
            </div>
            <div>
              <dd>Reviewed &amp; Approved by your vCISO.</dd>
            </div>
            <div>
              {/* One flag, two strings, used identically here and in the
                  Insurance Readiness checklist. Never a count. */}
              <dd>{acknowledgmentText(doc.acknowledged)}</dd>
            </div>
          </dl>

          <div className="flex shrink-0 gap-2">
            {url ? (
              <>
                <button
                  type="button"
                  onClick={() => setViewing(true)}
                  className={rowAction}
                  aria-label={`Open ${doc.name}`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
                    <path
                      d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="2.75" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => downloadFile(url, filename)}
                  className={rowAction}
                  aria-label={`Download ${doc.name}`}
                >
                  <DownloadGlyph />
                </button>
              </>
            ) : (
              // A row can exist before its file does — say so plainly rather
              // than leaving a spinner that never resolves.
              <p className="text-sm text-white/80">
                {doc.storagePath ? 'Preparing…' : 'File coming soon'}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {viewing && url ? (
        <FileViewer url={url} filename={filename} onClose={() => setViewing(false)} />
      ) : null}
    </li>
  )
}

const rowAction = [
  'flex size-11 items-center justify-center rounded-full bg-primary text-white',
  'transition-colors hover:bg-primary/85 outline-none',
  'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2',
  'focus-visible:ring-offset-primary-dark',
].join(' ')
