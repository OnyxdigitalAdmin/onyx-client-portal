/**
 * Covers the branching Onboarding Mode depends on, using the five seed
 * clients as cases — they were chosen to sit on the hard edges.
 *
 * Run with `npm test` (node:test, no framework, no browser).
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildDocumentSections,
  buildMilestones,
  categoryProgress,
  documentLabel,
  formatDateOnly,
  formatTimestamp,
  INCLUDED_WITH_MANAGEMENT,
  isPastDue,
  questionnaireState,
  type DocumentRow,
  type OpenItemRow,
} from './onboarding.ts'

const TODAY = new Date(2026, 7, 24) // 24 Aug 2026, local

const doc = (over: Partial<DocumentRow> & { doc_type: string }): DocumentRow => ({
  id: over.doc_type,
  status: 'current',
  last_updated: '2026-08-01T14:30:00+00:00',
  signed_count: null,
  signatures_required: null,
  ...over,
})

const item = (over: Partial<OpenItemRow> & { category: string; status: string }): OpenItemRow => ({
  id: `${over.category}-${over.status}-${over.title ?? ''}`,
  title: 'An open item',
  ...over,
})

/* ----------------------------------------------------------------------- dates */

test('a plain date column keeps its calendar day regardless of timezone', () => {
  // new Date('2026-09-01') would be UTC midnight — 31 Aug in Boston.
  assert.equal(formatDateOnly('2026-09-01'), 'Sep 1, 2026')
  assert.equal(formatDateOnly(null), null)
})

test('a timestamp renders as a date and never a time', () => {
  const rendered = formatTimestamp('2026-08-01T14:30:00+00:00')
  assert.match(rendered ?? '', /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/)
})

test('past due compares calendar days', () => {
  assert.equal(isPastDue('2026-08-23', TODAY), true)
  assert.equal(isPastDue('2026-08-24', TODAY), false) // due today is not overdue
  assert.equal(isPastDue('2026-09-30', TODAY), false)
  assert.equal(isPastDue(null, TODAY), false)
})

/* --------------------------------------------------------------- questionnaire */

test('questionnaire card disappears entirely once approved', () => {
  const state = questionnaireState(
    {
      questionnaireApprovedAt: '2026-07-02T10:00:00+00:00',
      questionnaireSubmittedAt: '2026-06-28T10:00:00+00:00',
      questionnaireDueDate: '2026-06-01',
    },
    TODAY,
  )
  assert.equal(state, null)
})

test('questionnaire states cover not-started, overdue and submitted', () => {
  const base = { questionnaireApprovedAt: null, questionnaireSubmittedAt: null }

  assert.equal(questionnaireState({ ...base, questionnaireDueDate: '2026-09-30' }, TODAY), 'not-started')
  // Meridian: overdue, which is an attention state and never an error state.
  assert.equal(questionnaireState({ ...base, questionnaireDueDate: '2026-07-01' }, TODAY), 'overdue')
  assert.equal(
    questionnaireState(
      { ...base, questionnaireSubmittedAt: '2026-08-20T10:00:00+00:00', questionnaireDueDate: '2026-07-01' },
      TODAY,
    ),
    'submitted',
  )
})

/* ------------------------------------------------------------------ milestones */

test('Meridian renders all six stages cleanly with zero stage_events', () => {
  const milestones = buildMilestones({ onboardingStage: 1, package: 'Management' }, [])

  assert.equal(milestones.length, 6)
  assert.deepEqual(
    milestones.map((m) => m.state),
    ['current', 'upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming'],
  )
  assert.ok(milestones.every((m) => m.completedOn === null))
})

test('completed stages carry their date, and only when a row exists', () => {
  const milestones = buildMilestones({ onboardingStage: 4, package: 'Management' }, [
    { stage: 1, completed_at: '2026-05-04T12:00:00+00:00' },
    { stage: 3, completed_at: '2026-07-15T12:00:00+00:00' },
  ])

  assert.equal(milestones[0].state, 'complete')
  assert.equal(milestones[0].completedOn, 'May 4, 2026')
  assert.equal(milestones[1].completedOn, null) // completed, but no stage_events row
  assert.equal(milestones[2].completedOn, 'Jul 15, 2026')
  assert.equal(milestones[3].state, 'current')
  assert.equal(milestones[3].completedOn, null)
})

test('Assess stages 4-6 are a path, not upcoming stages', () => {
  const milestones = buildMilestones({ onboardingStage: 3, package: 'Assess' }, [])

  assert.deepEqual(
    milestones.map((m) => m.state),
    ['complete', 'complete', 'current', 'management', 'management', 'management'],
  )
})

test('Copley Tax at stage 6 shows five complete stages and Managed as current', () => {
  const milestones = buildMilestones({ onboardingStage: 6, package: 'Leadership' }, [])

  assert.equal(milestones.filter((m) => m.state === 'complete').length, 5)
  assert.equal(milestones[5].state, 'current')
  assert.equal(milestones[5].label, 'Managed')
})

/* -------------------------------------------------------------------- progress */

test('progress is computed live from the items, not read from a column', () => {
  const items = [
    item({ category: 'insurance', status: 'complete' }),
    item({ category: 'insurance', status: 'in_progress', title: 'MFA rollout' }),
    item({ category: 'insurance', status: 'open', title: 'Backup testing' }),
    item({ category: 'insurance', status: 'open', title: 'Vendor review' }),
  ]

  const insurance = categoryProgress(items, 'insurance')
  assert.equal(insurance?.percent, 25)
  assert.deepEqual(insurance?.outstanding.map((o) => o.title), [
    'MFA rollout',
    'Backup testing',
    'Vendor review',
  ])
})

test('a category with no items renders nothing rather than 0%', () => {
  assert.equal(categoryProgress([item({ category: 'insurance', status: 'open' })], 'compliance'), null)
})

test('Copley Tax at 100% lists nothing outstanding', () => {
  const items = [
    item({ category: 'compliance', status: 'complete' }),
    item({ category: 'compliance', status: 'complete', title: 'b' }),
  ]
  const progress = categoryProgress(items, 'compliance')

  assert.equal(progress?.percent, 100)
  assert.equal(progress?.outstanding.length, 0)
})

/* ------------------------------------------------------------------- documents */

test('the evidence binder is named for the client vertical', () => {
  assert.equal(documentLabel('Evidence Binder', 'RIA'), 'Examination Evidence Binder')
  assert.equal(documentLabel('Evidence Binder', 'CPA'), 'Safeguards Evidence Binder')
  assert.equal(documentLabel('Evidence Binder', 'Medical'), 'Evidence Binder')
  assert.equal(documentLabel('WISP', 'RIA'), 'WISP')
})

test('an empty section is not rendered at all', () => {
  const sections = buildDocumentSections([doc({ doc_type: 'WISP' })], {
    package: 'Management',
    vertical: 'RIA',
  })

  assert.deepEqual(sections.map((s) => s.name), ['Governance'])
})

test('Kessler (Assess) sees Governance and Evidence as Included with Management', () => {
  const sections = buildDocumentSections(
    [doc({ doc_type: 'Compliance Gap Analysis' }), doc({ doc_type: 'Risk Register & Remediation Roadmap' })],
    { package: 'Assess', vertical: 'CPA' },
  )

  assert.deepEqual(sections.map((s) => s.name), ['Assessment', 'Governance', 'Evidence'])
  assert.ok(sections[0].tiles.every((t) => t.state === 'available'))
  assert.ok(sections[1].tiles.every((t) => t.state === 'management'))
  // Vertical naming still applies to a document the package doesn't include.
  assert.equal(sections[2].tiles[0].label, 'Safeguards Evidence Binder')
  assert.equal(INCLUDED_WITH_MANAGEMENT, 'Included with Management')
})

test('pending signatures read as a count, available documents as a date', () => {
  const sections = buildDocumentSections(
    [
      doc({ doc_type: 'WISP', status: 'pending_signature', signed_count: 6, signatures_required: 14 }),
      doc({ doc_type: 'IR Plan' }),
    ],
    { package: 'Management', vertical: 'RIA' },
  )

  const [wisp, irPlan] = sections[0].tiles
  assert.equal(wisp.state === 'pending-signature' && wisp.signed, '6 of 14 signed')
  assert.equal(irPlan.state === 'available' && irPlan.completedOn, 'Aug 1, 2026')
})

test('Reports shows the three most recent and carries the view-all link', () => {
  const sections = buildDocumentSections(
    [
      doc({ id: 'r1', doc_type: 'Monthly Compliance & Security Report', last_updated: '2026-05-01T00:00:00+00:00' }),
      doc({ id: 'r2', doc_type: 'Vulnerability Scan Report', last_updated: '2026-08-01T00:00:00+00:00' }),
      doc({ id: 'r3', doc_type: 'Quarterly Business Review', last_updated: '2026-07-01T00:00:00+00:00' }),
      doc({ id: 'r4', doc_type: 'Monthly Compliance & Security Report', last_updated: '2026-06-01T00:00:00+00:00' }),
    ],
    { package: 'Leadership', vertical: 'CPA' },
  )

  const reports = sections.find((s) => s.name === 'Reports')
  assert.equal(reports?.viewAll, true)
  assert.deepEqual(reports?.tiles.map((t) => t.key), ['r2', 'r3', 'r4'])
})

test('an unrecognised doc_type surfaces in Reports rather than vanishing', () => {
  const sections = buildDocumentSections([doc({ id: 'x', doc_type: 'Some New Report Type' })], {
    package: 'Management',
    vertical: 'RIA',
  })

  assert.deepEqual(sections.map((s) => s.name), ['Reports'])
})

test('Bay State: an Assess client with no documents has nothing real to show', () => {
  // Only the two "Included with Management" sections can be derived, and no
  // section carries a real document — which is exactly the case the page
  // short-circuits to the calm empty line, ahead of rendering any section.
  const sections = buildDocumentSections([], { package: 'Assess', vertical: 'RIA' })

  assert.deepEqual(sections.map((s) => s.name), ['Governance', 'Evidence'])
  assert.ok(sections.every((s) => s.tiles.every((t) => t.state === 'management')))
})
