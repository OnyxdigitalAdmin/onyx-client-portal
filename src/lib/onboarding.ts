/**
 * Everything Onboarding Mode derives from the four tables it reads.
 *
 * Deliberately free of runtime imports so the branching here — package
 * differences, stage states, live percentages, section grouping — can be
 * exercised by `npm test` without a browser or a database.
 */

/**
 * The client fields this module derives from. Defined here rather than
 * imported so the module stays dependency-free; ClientContext is built on it.
 */
export type ClientFacts = {
  companyName: string
  onboardingStage: number
  /** 'RIA' | 'CPA' | 'Medical' — drives vertical-specific document naming. */
  vertical: string | null
  /** 'Assess' | 'Management' | 'Leadership'. Assess stops at stage 3. */
  package: string | null
  /** A plain `date`, not a timestamp — keep it as its YYYY-MM-DD string. */
  questionnaireDueDate: string | null
  questionnaireSubmittedAt: string | null
  questionnaireApprovedAt: string | null
}
/** The six onboarding stages, in order. Index + 1 is the stage number. */
export const STAGE_LABELS = [
  'Kickoff',
  'Assessment',
  'Findings Delivered',
  'Remediation',
  'Compliance Ready',
  'Managed',
] as const

/** Assess stops at Findings Delivered; stages 4-6 are what Management adds. */
export const ASSESS_FINAL_STAGE = 3
export const INCLUDED_WITH_MANAGEMENT = 'Included with Management'

/** The progress indicator is hidden until findings exist to measure against. */
export const PROGRESS_FROM_STAGE = 3

export type DocumentRow = {
  id: string
  doc_type: string
  status: string
  last_updated: string | null
  signed_count: number | null
  signatures_required: number | null
}

export type OpenItemRow = {
  id: string
  category: string
  status: string
  title: string
}

export type StageEventRow = { stage: number; completed_at: string | null }

/* -------------------------------------------------------------------------
 * Dates — the portal shows a date and never a time.
 * ---------------------------------------------------------------------- */

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}

/** A `timestamptz` column (completed_at, last_updated) as a local date. */
export function formatTimestamp(value: string | null | undefined): string | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString('en-US', DATE_FORMAT)
}

/**
 * A plain `date` column (questionnaire_due_date) as a local date.
 *
 * Deliberately not `new Date(value)`: that reads a bare YYYY-MM-DD as UTC
 * midnight, which renders as the *previous* day everywhere west of Greenwich —
 * including Boston. Building from the parts keeps the calendar day intact.
 */
export function formatDateOnly(value: string | null | undefined): string | null {
  const parts = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!parts) return null
  const [, year, month, day] = parts
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(
    'en-US',
    DATE_FORMAT,
  )
}

const toLocalIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** Calendar-day comparison, for the same timezone reason as formatDateOnly. */
export function isPastDue(dueDate: string | null | undefined, today = new Date()): boolean {
  if (!dueDate) return false
  return dueDate.slice(0, 10) < toLocalIsoDate(today)
}

/* -------------------------------------------------------------------------
 * Questionnaire
 * ---------------------------------------------------------------------- */

/** null means approved — the card disappears entirely, leaving no gap. */
export type QuestionnaireState = 'not-started' | 'overdue' | 'submitted' | null

export function questionnaireState(
  client: Pick<
    ClientFacts,
    'questionnaireApprovedAt' | 'questionnaireSubmittedAt' | 'questionnaireDueDate'
  >,
  today = new Date(),
): QuestionnaireState {
  if (client.questionnaireApprovedAt) return null
  if (client.questionnaireSubmittedAt) return 'submitted'
  return isPastDue(client.questionnaireDueDate, today) ? 'overdue' : 'not-started'
}

/* -------------------------------------------------------------------------
 * Milestone tracker
 * ---------------------------------------------------------------------- */

export type MilestoneState = 'complete' | 'current' | 'upcoming' | 'management'

export type Milestone = {
  stage: number
  label: string
  state: MilestoneState
  /** Only ever set on a completed stage, and only if stage_events has a row. */
  completedOn: string | null
}

export function buildMilestones(
  client: Pick<ClientFacts, 'onboardingStage' | 'package'>,
  stageEvents: StageEventRow[],
): Milestone[] {
  const isAssess = client.package === 'Assess'

  return STAGE_LABELS.map((label, index) => {
    const stage = index + 1
    const state: MilestoneState =
      isAssess && stage > ASSESS_FINAL_STAGE
        ? 'management'
        : stage < client.onboardingStage
          ? 'complete'
          : stage === client.onboardingStage
            ? 'current'
            : 'upcoming'

    return {
      stage,
      label,
      state,
      completedOn:
        state === 'complete'
          ? formatTimestamp(stageEvents.find((event) => event.stage === stage)?.completed_at)
          : null,
    }
  })
}

/* -------------------------------------------------------------------------
 * Progress — always computed live, never read from a stored percentage.
 * ---------------------------------------------------------------------- */

export type CategoryProgress = {
  percent: number
  /** Open and in-progress items. Completed work is not listed back at anyone. */
  outstanding: OpenItemRow[]
}

/** Returns null for a category with no items at all — rendered as nothing, not 0%. */
export function categoryProgress(
  openItems: OpenItemRow[],
  category: string,
): CategoryProgress | null {
  const inCategory = openItems.filter((item) => item.category === category)
  if (inCategory.length === 0) return null

  const complete = inCategory.filter((item) => item.status === 'complete').length

  return {
    percent: Math.round((complete / inCategory.length) * 100),
    outstanding: inCategory.filter((item) => item.status !== 'complete'),
  }
}

/* -------------------------------------------------------------------------
 * Document library
 * ---------------------------------------------------------------------- */

type SectionSpec = { name: string; docTypes: string[]; managementOnly?: boolean }

const SECTION_SPECS: SectionSpec[] = [
  {
    name: 'Assessment',
    docTypes: ['Compliance Gap Analysis', 'Risk Register & Remediation Roadmap'],
  },
  {
    name: 'Governance',
    docTypes: [
      'WISP',
      'IR Plan',
      'Annual Written Risk Assessment',
      'Vendor Oversight Register',
      'Asset Inventory',
    ],
    managementOnly: true,
  },
  {
    name: 'Evidence',
    docTypes: ['Evidence Binder', 'Broker & Underwriter Submission Package'],
    managementOnly: true,
  },
]

const FIXED_DOC_TYPES = new Set(SECTION_SPECS.flatMap((section) => section.docTypes))

export const REPORTS_SHOWN = 3

/**
 * The evidence binder is named for what the client's regulator calls the
 * exercise, so the document reads the way their examiner will ask for it.
 */
export function documentLabel(docType: string, vertical: string | null): string {
  if (docType !== 'Evidence Binder') return docType
  if (vertical === 'RIA') return 'Examination Evidence Binder'
  if (vertical === 'CPA') return 'Safeguards Evidence Binder'
  return docType
}

export type Tile = {
  key: string
  label: string
} & (
  | { state: 'available'; completedOn: string | null }
  | { state: 'pending-signature'; signed: string }
  | { state: 'management' }
)

export type DocumentSection = {
  name: string
  tiles: Tile[]
  /** Reports overflow past the three most recent, so it carries the link. */
  viewAll?: boolean
}

function toTile(doc: DocumentRow, vertical: string | null): Tile {
  const label = documentLabel(doc.doc_type, vertical)

  if (doc.status === 'pending_signature') {
    return {
      key: doc.id,
      label,
      state: 'pending-signature',
      signed: `${doc.signed_count ?? 0} of ${doc.signatures_required ?? 0} signed`,
    }
  }

  return { key: doc.id, label, state: 'available', completedOn: formatTimestamp(doc.last_updated) }
}

const byMostRecent = (a: DocumentRow, b: DocumentRow) =>
  (b.last_updated ? Date.parse(b.last_updated) : 0) -
  (a.last_updated ? Date.parse(a.last_updated) : 0)

/**
 * Groups documents into the four library sections.
 *
 * An Assess client has no Governance or Evidence documents to hold, so those
 * sections show what the Management package adds instead of vanishing — the
 * point is to show a path forward, never to lock a door.
 */
export function buildDocumentSections(
  documents: DocumentRow[],
  client: Pick<ClientFacts, 'package' | 'vertical'>,
): DocumentSection[] {
  const isAssess = client.package === 'Assess'
  const sections: DocumentSection[] = []

  for (const spec of SECTION_SPECS) {
    const tiles: Tile[] =
      isAssess && spec.managementOnly
        ? spec.docTypes.map((docType) => ({
            key: docType,
            label: documentLabel(docType, client.vertical),
            state: 'management',
          }))
        : spec.docTypes.flatMap((docType) =>
            documents
              .filter((doc) => doc.doc_type === docType)
              .map((doc) => toTile(doc, client.vertical)),
          )

    if (tiles.length > 0) sections.push({ name: spec.name, tiles })
  }

  // Reports is the remainder rather than a fixed list: the recurring documents
  // repeat, and anything whose type the three fixed sections don't name still
  // surfaces here instead of being silently dropped.
  const reports = documents.filter((doc) => !FIXED_DOC_TYPES.has(doc.doc_type)).sort(byMostRecent)

  if (reports.length > 0) {
    sections.push({
      name: 'Reports',
      tiles: reports.slice(0, REPORTS_SHOWN).map((doc) => toTile(doc, client.vertical)),
      viewAll: true,
    })
  }

  return sections
}
