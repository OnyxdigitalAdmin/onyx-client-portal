/**
 * Covers the branching Onboarding Mode depends on, using the five seed
 * clients as cases — they were chosen to sit on the hard edges.
 *
 * Run with `npm test` (node:test, no framework, no browser).
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyAcknowledgments,
  buildMilestones,
  categoryProgress,
  formatDateOnly,
  formatTimestamp,
  INCLUDED_WITH_MANAGEMENT,
  isPastDue,
  questionnaireState,
  STAGE_LABELS,
  type OpenItemRow,
} from './onboarding.ts'

const TODAY = new Date(2026, 7, 24) // 24 Aug 2026, local

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

test('there are five stages, and Managed is not one of them', () => {
  assert.equal(STAGE_LABELS.length, 5)
  assert.equal(STAGE_LABELS.at(-1), 'Compliance Ready')
  assert.ok(!STAGE_LABELS.includes('Managed' as never))
})

test('Meridian renders all five stages cleanly with zero stage_events', () => {
  const milestones = buildMilestones({ onboardingStage: 1, package: 'Management' }, [])

  assert.equal(milestones.length, 5)
  assert.deepEqual(
    milestones.map((m) => m.state),
    ['current', 'upcoming', 'upcoming', 'upcoming', 'upcoming'],
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

test('Assess stages 4-5 are a path, not upcoming stages', () => {
  const milestones = buildMilestones({ onboardingStage: 3, package: 'Assess' }, [])

  assert.deepEqual(
    milestones.map((m) => m.state),
    ['complete', 'complete', 'current', 'management', 'management'],
  )
  assert.equal(INCLUDED_WITH_MANAGEMENT, 'Included with Management')
})

test('Copley Tax past stage 5 has every stage complete and no current one', () => {
  // onboarding_stage 6 means the programme is finished; the portal leaves
  // Onboarding Mode rather than showing a sixth milestone.
  const milestones = buildMilestones({ onboardingStage: 6, package: 'Leadership' }, [])

  assert.equal(milestones.filter((m) => m.state === 'complete').length, 5)
  assert.equal(milestones.filter((m) => m.state === 'current').length, 0)
})

/* -------------------------------------------------------------------- progress */

test('the percentage is complete over total, and every item is listed', () => {
  const items = [
    item({ category: 'insurance', status: 'complete' }),
    item({ category: 'insurance', status: 'in_progress', title: 'MFA rollout' }),
    item({ category: 'insurance', status: 'open', title: 'Backup testing' }),
    item({ category: 'insurance', status: 'open', title: 'Vendor review' }),
  ]

  const insurance = categoryProgress(items, 'insurance')
  assert.equal(insurance?.percent, 25)
  // Countable: four lines, one ticked, 25%.
  assert.equal(insurance?.items.length, 4)
  assert.equal(insurance?.items.filter((i) => i.complete).length, 1)
})

test('zero of five is 0%, not some other number', () => {
  const items = Array.from({ length: 5 }, (_, index) =>
    item({ category: 'compliance', status: 'open', title: `Item ${index}` }),
  )
  const progress = categoryProgress(items, 'compliance')

  assert.equal(progress?.percent, 0)
  assert.equal(progress?.items.length, 5)
})

test('an in-progress item counts as not complete', () => {
  const progress = categoryProgress(
    [
      item({ category: 'compliance', status: 'complete' }),
      item({ category: 'compliance', status: 'in_progress', title: 'b' }),
    ],
    'compliance',
  )
  assert.equal(progress?.percent, 50)
})

test('a category with no items renders nothing rather than 0%', () => {
  assert.equal(categoryProgress([item({ category: 'insurance', status: 'open' })], 'compliance'), null)
})

test('Copley Tax at 100% still lists every completed item', () => {
  const items = [
    item({ category: 'compliance', status: 'complete' }),
    item({ category: 'compliance', status: 'complete', title: 'b' }),
  ]
  const progress = categoryProgress(items, 'compliance')

  assert.equal(progress?.percent, 100)
  assert.ok(progress?.items.every((i) => i.complete))
})

/* ------------------------------------------------------------ acknowledgments */

test('signature lines are rewritten to read from the document flag', () => {
  const rewritten = applyAcknowledgments(
    [
      item({ category: 'insurance', status: 'open', title: 'IR Plan signed by all employees' }),
      item({ category: 'insurance', status: 'in_progress', title: 'WISP signed by all employees' }),
    ],
    [
      { doc_type: 'IR Plan', all_employees_acknowledged: true },
      { doc_type: 'WISP', all_employees_acknowledged: false },
    ],
  )

  assert.deepEqual(
    rewritten.map((i) => i.title),
    [
      'Incident Response Plan acknowledged by all employees',
      'Written Information Security Plan acknowledged by all employees',
    ],
  )
  // The flag wins over the item's own status, including its in-progress state.
  assert.deepEqual(rewritten.map((i) => i.status), ['complete', 'open'])
})

test('the canonical document names match too, not just the short forms', () => {
  const [rewritten] = applyAcknowledgments(
    [
      item({
        category: 'insurance',
        status: 'open',
        title: 'Written Information Security Plan signed by all employees',
      }),
    ],
    [{ doc_type: 'Written Information Security Plan', all_employees_acknowledged: true }],
  )

  assert.equal(rewritten.title, 'Written Information Security Plan acknowledged by all employees')
  assert.equal(rewritten.status, 'complete')
})

test('an item with no matching document keeps its own wording and status', () => {
  const before = item({ category: 'insurance', status: 'in_progress', title: 'WISP signed by all employees' })
  assert.deepEqual(applyAcknowledgments([before], []), [before])
})

test('ordinary items are left alone', () => {
  const before = item({ category: 'insurance', status: 'open', title: 'MFA rollout' })
  assert.deepEqual(applyAcknowledgments([before], [{ doc_type: 'WISP', all_employees_acknowledged: true }]), [
    before,
  ])
})
