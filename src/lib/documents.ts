/**
 * Everything the document library and sharing derive from the `documents` and
 * `share_links` tables.
 *
 * Kept free of runtime imports — like `onboarding.ts` — so `npm test` can
 * exercise the ordering, naming and expiry logic under plain Node.
 */

/** The six documents the library names, in the order they are numbered. */
export const CANONICAL_DOC_TYPES = [
  'Written Information Security Plan',
  'Vendor Security Overview',
  'Incident Response Plan',
  'Risk Register',
  'Remediation Roadmap',
  'Compliance Gap Analysis',
] as const

export type CanonicalDocType = (typeof CANONICAL_DOC_TYPES)[number]

/**
 * Short forms the database already holds, mapped to the canonical names above.
 *
 * `doc_type` is the display name, so a row seeded as 'WISP' would otherwise
 * render as 'WISP'. Bridging here rather than renaming rows means the library
 * shows the approved spelling whichever form a row was created with.
 */
const DOC_TYPE_ALIASES: Record<string, CanonicalDocType> = {
  WISP: 'Written Information Security Plan',
  'IR Plan': 'Incident Response Plan',
  'Incident Response Plan (IRP)': 'Incident Response Plan',
  'Vendor Oversight Register': 'Vendor Security Overview',
  'Risk Register & Remediation Roadmap': 'Risk Register',
}

/** The name a client sees for a document row. */
export function documentName(docType: string): string {
  return DOC_TYPE_ALIASES[docType] ?? docType
}

export type LibraryDocumentRow = {
  id: string
  doc_type: string
  last_updated: string | null
  all_employees_acknowledged: boolean | null
  storage_path: string | null
}

export type LibraryDocument = {
  id: string
  /** 1-based, rendered as "01." */
  number: number
  name: string
  createdOn: string | null
  acknowledged: boolean
  storagePath: string | null
}

/**
 * The two acknowledgment states, and the only two strings either surface uses.
 *
 * Never a count. No "25 of 25", no headcount, no per-employee tracking — the
 * flag is set manually by Onyx staff and says one thing or the other.
 */
export const ACKNOWLEDGED_TEXT = 'Acknowledged by all employees'
export const AWAITING_ACKNOWLEDGMENT_TEXT = 'Awaiting employee acknowledgment'

export function acknowledgmentText(acknowledged: boolean | null | undefined): string {
  return acknowledged ? ACKNOWLEDGED_TEXT : AWAITING_ACKNOWLEDGMENT_TEXT
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}

export function formatCreated(value: string | null | undefined): string | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString('en-US', DATE_FORMAT)
}

/**
 * Orders and numbers the library.
 *
 * Canonical documents lead in the order above; anything else keeps its own
 * order behind them rather than being dropped, so a new or renamed doc_type
 * still reaches the client.
 */
export function buildLibrary(rows: LibraryDocumentRow[]): LibraryDocument[] {
  const rank = (row: LibraryDocumentRow) => {
    const index = CANONICAL_DOC_TYPES.indexOf(documentName(row.doc_type) as CanonicalDocType)
    return index === -1 ? CANONICAL_DOC_TYPES.length : index
  }

  return [...rows]
    .sort((a, b) => rank(a) - rank(b))
    .map((row, index) => ({
      id: row.id,
      number: index + 1,
      name: documentName(row.doc_type),
      createdOn: formatCreated(row.last_updated),
      acknowledged: row.all_employees_acknowledged === true,
      storagePath: row.storage_path,
    }))
}

/* -------------------------------------------------------------------------
 * Sharing
 * ---------------------------------------------------------------------- */

/** The two roles that may create and revoke share links. Everyone else reads. */
export const SHARING_ROLES = ['primary_contact', 'approval_authority'] as const

export function canShare(role: string | null | undefined): boolean {
  return SHARING_ROLES.includes(role as (typeof SHARING_ROLES)[number])
}

export type ShareAudience = 'insurer_broker' | 'examiner_auditor'

/**
 * Two audiences, each with its own fixed document set. The client picks who
 * the documents are for; they never hand-pick documents. Partner sharing was
 * considered and cut, so there is deliberately no third entry.
 */
export const SHARE_AUDIENCES: {
  value: ShareAudience
  label: string
  description: string
  docTypes: CanonicalDocType[]
}[] = [
  {
    value: 'insurer_broker',
    label: 'Insurer / Broker',
    description: 'The underwriting set: your security plan, incident response, vendors and risks.',
    docTypes: [
      'Written Information Security Plan',
      'Incident Response Plan',
      'Vendor Security Overview',
      'Risk Register',
    ],
  },
  {
    value: 'examiner_auditor',
    label: 'Examiner / Auditor',
    description: 'The examination set: your security plan, incident response, gaps and remediation.',
    docTypes: [
      'Written Information Security Plan',
      'Incident Response Plan',
      'Compliance Gap Analysis',
      'Remediation Roadmap',
      'Risk Register',
    ],
  },
]

export const SHARE_LINK_DAYS = 30

export type ShareLinkRow = {
  id: string
  token: string
  audience: string
  expires_at: string
  revoked: boolean
}

/** Not revoked and not yet expired. Anything else is simply not shown. */
export function isActive(link: ShareLinkRow, now = new Date()): boolean {
  return !link.revoked && new Date(link.expires_at).getTime() > now.getTime()
}

export function audienceLabel(audience: string): string {
  return SHARE_AUDIENCES.find((option) => option.value === audience)?.label ?? audience
}

export function formatExpiry(value: string): string {
  return new Date(value).toLocaleDateString('en-US', DATE_FORMAT)
}

/** The recipient URL. Deliberately session-independent: token in, nothing else. */
export function shareUrl(token: string, origin: string): string {
  return `${origin}/share/${token}`
}
