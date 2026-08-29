/**
 * Everything Onboarding Mode derives from the four tables it reads.
 *
 * Deliberately free of runtime imports so the branching here — package
 * differences, stage states, live percentages, acknowledgment lines — can be
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
/**
 * The five onboarding stages, in order. Index + 1 is the stage number.
 *
 * 'Managed' is deliberately absent: it is not a milestone but what happens
 * after the programme ends. Completing stage 5 takes the client out of
 * Onboarding Mode entirely rather than on to a sixth step.
 */
export const STAGE_LABELS = [
  'Kickoff',
  'Assessment',
  'Findings Delivered',
  'Remediation',
  'Compliance Ready',
] as const

/** Assess stops at Findings Delivered; stages 4-5 are what Management adds. */
export const ASSESS_FINAL_STAGE = 3
export const INCLUDED_WITH_MANAGEMENT = 'Included with Management'

/** The progress indicator is hidden until findings exist to measure against. */
export const PROGRESS_FROM_STAGE = 3

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

export type ChecklistItem = { id: string; title: string; complete: boolean }

export type CategoryProgress = {
  percent: number
  /** Every item in the category, complete or not. */
  items: ChecklistItem[]
}

/**
 * Completed items divided by total items, and the whole list behind it.
 *
 * The list is complete on purpose. A percentage computed against items the
 * client cannot see is a number they cannot check — count the ticks, get the
 * same figure, every time. Returns null for a category with no items at all,
 * which renders as nothing rather than as 0%.
 */
export function categoryProgress(
  openItems: OpenItemRow[],
  category: string,
): CategoryProgress | null {
  const inCategory = openItems.filter((item) => item.category === category)
  if (inCategory.length === 0) return null

  const items = inCategory.map((item) => ({
    id: item.id,
    title: item.title,
    complete: item.status === 'complete',
  }))

  return {
    percent: Math.round((items.filter((item) => item.complete).length / items.length) * 100),
    items,
  }
}

/* -------------------------------------------------------------------------
 * Employee acknowledgment
 * ---------------------------------------------------------------------- */

/** The two documents whose checklist line is driven by the acknowledgment flag. */
const ACKNOWLEDGED_DOCS = [
  {
    name: 'Written Information Security Plan',
    matches: /\bWISP\b|written information security/i,
  },
  {
    name: 'Incident Response Plan',
    matches: /\bIRP?\b|\bIR Plan\b|incident response/i,
  },
] as const

/** A signature line, in whichever wording the item was written with. */
const SIGNATURE_LINE = /sign(ed|ature)|acknowledg/i

export type AcknowledgmentRow = { doc_type: string; all_employees_acknowledged: boolean | null }

/**
 * Rewrites the two signature checklist lines to read from the document flag.
 *
 * Both surfaces — this checklist and the library's detail row — resolve to one
 * boolean per document, so they can never disagree. The wording drops any
 * count and any in-progress middle state: the flag says acknowledged or it
 * does not. An item whose document is missing keeps its own status rather than
 * silently reading as unacknowledged.
 */
export function applyAcknowledgments(
  openItems: OpenItemRow[],
  documents: AcknowledgmentRow[],
): OpenItemRow[] {
  return openItems.map((item) => {
    if (!SIGNATURE_LINE.test(item.title)) return item

    const doc = ACKNOWLEDGED_DOCS.find((candidate) => candidate.matches.test(item.title))
    if (!doc) return item

    const row = documents.find((candidate) => doc.matches.test(candidate.doc_type))
    if (!row) return item

    return {
      ...item,
      title: `${doc.name} acknowledged by all employees`,
      status: row.all_employees_acknowledged ? 'complete' : 'open',
    }
  })
}
