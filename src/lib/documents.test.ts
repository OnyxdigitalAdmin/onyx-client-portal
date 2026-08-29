/**
 * The library's naming, ordering and numbering, plus the sharing rules.
 *
 * Run with `npm test` (node:test, no framework, no browser).
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACKNOWLEDGED_TEXT,
  AWAITING_ACKNOWLEDGMENT_TEXT,
  acknowledgmentText,
  buildLibrary,
  canShare,
  documentName,
  isActive,
  SHARE_AUDIENCES,
  shareUrl,
  type LibraryDocumentRow,
  type ShareLinkRow,
} from './documents.ts'

const row = (over: Partial<LibraryDocumentRow> & { doc_type: string }): LibraryDocumentRow => ({
  id: over.doc_type,
  last_updated: '2026-08-28T14:30:00+00:00',
  all_employees_acknowledged: false,
  storage_path: null,
  ...over,
})

/* ------------------------------------------------------------------- naming */

test('legacy short forms render as the approved names', () => {
  assert.equal(documentName('WISP'), 'Written Information Security Plan')
  assert.equal(documentName('IR Plan'), 'Incident Response Plan')
  assert.equal(documentName('Vendor Oversight Register'), 'Vendor Security Overview')
})

test('the spelling is Remediation, and Assessment Report does not exist', () => {
  assert.equal(documentName('Remediation Roadmap'), 'Remediation Roadmap')
  const library = buildLibrary([row({ doc_type: 'Remediation Roadmap' })])
  assert.equal(library[0].name, 'Remediation Roadmap')
})

/* ----------------------------------------------------------------- ordering */

test('the library numbers documents in the approved order', () => {
  const library = buildLibrary([
    row({ id: 'c', doc_type: 'Compliance Gap Analysis' }),
    row({ id: 'a', doc_type: 'WISP' }),
    row({ id: 'b', doc_type: 'Incident Response Plan' }),
  ])

  assert.deepEqual(
    library.map((doc) => [doc.number, doc.name]),
    [
      [1, 'Written Information Security Plan'],
      [2, 'Incident Response Plan'],
      [3, 'Compliance Gap Analysis'],
    ],
  )
})

test('an unrecognised doc_type still reaches the client, at the end', () => {
  const library = buildLibrary([
    row({ id: 'x', doc_type: 'Quarterly Business Review' }),
    row({ id: 'a', doc_type: 'WISP' }),
  ])

  assert.deepEqual(library.map((doc) => doc.name), [
    'Written Information Security Plan',
    'Quarterly Business Review',
  ])
})

test('a new client has an empty library rather than a broken one', () => {
  assert.deepEqual(buildLibrary([]), [])
})

test('the created date renders long-form and survives a missing value', () => {
  assert.equal(buildLibrary([row({ doc_type: 'Risk Register' })])[0].createdOn, 'August 28, 2026')
  assert.equal(buildLibrary([row({ doc_type: 'Risk Register', last_updated: null })])[0].createdOn, null)
})

/* ---------------------------------------------------------- acknowledgment */

test('acknowledgment has exactly two states and never a count', () => {
  assert.equal(acknowledgmentText(true), ACKNOWLEDGED_TEXT)
  assert.equal(acknowledgmentText(false), AWAITING_ACKNOWLEDGMENT_TEXT)
  // A null flag is not yet acknowledged; it is never rendered as unknown.
  assert.equal(acknowledgmentText(null), AWAITING_ACKNOWLEDGMENT_TEXT)
  assert.ok(![ACKNOWLEDGED_TEXT, AWAITING_ACKNOWLEDGMENT_TEXT].some((text) => /\d/.test(text)))
})

/* ----------------------------------------------------------------- sharing */

test('only the two named roles may share', () => {
  assert.equal(canShare('primary_contact'), true)
  assert.equal(canShare('approval_authority'), true)
  assert.equal(canShare('member'), false)
  assert.equal(canShare(null), false)
})

test('there are exactly two audiences, and no partner option', () => {
  assert.equal(SHARE_AUDIENCES.length, 2)
  assert.deepEqual(SHARE_AUDIENCES.map((a) => a.label), ['Insurer / Broker', 'Examiner / Auditor'])
  assert.ok(SHARE_AUDIENCES.every((a) => a.docTypes.length > 0))
})

test('a link is active until it is revoked or expires', () => {
  const now = new Date('2026-08-29T12:00:00Z')
  const link = (over: Partial<ShareLinkRow>): ShareLinkRow => ({
    id: '1',
    token: 't',
    audience: 'insurer_broker',
    expires_at: '2026-09-28T12:00:00Z',
    revoked: false,
    ...over,
  })

  assert.equal(isActive(link({}), now), true)
  assert.equal(isActive(link({ revoked: true }), now), false)
  assert.equal(isActive(link({ expires_at: '2026-08-28T12:00:00Z' }), now), false)
})

test('the share URL carries only the token — no session, no client id', () => {
  const url = shareUrl('abc123', 'https://portal.example')
  assert.equal(url, 'https://portal.example/share/abc123')
})
