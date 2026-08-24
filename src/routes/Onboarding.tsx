import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePortal } from '../hooks/usePortal'
import type {
  CategoryProgress,
  ClientFacts,
  DocumentRow,
  Milestone,
  OpenItemRow,
  QuestionnaireState,
  StageEventRow,
  Tile,
} from '../lib/onboarding'
import {
  buildDocumentSections,
  buildMilestones,
  categoryProgress,
  formatDateOnly,
  INCLUDED_WITH_MANAGEMENT,
  PROGRESS_FROM_STAGE,
  questionnaireState,
  STAGE_LABELS,
} from '../lib/onboarding'
import { supabase } from '../lib/supabaseClient'

type OnboardingData = {
  documents: DocumentRow[]
  openItems: OpenItemRow[]
  stageEvents: StageEventRow[]
}

/**
 * Everything the dashboard reads, in one round trip. Row-Level Security
 * already scopes each table to the caller's company; the explicit client_id
 * filter states that intent rather than relying on the policy alone.
 */
async function fetchOnboardingData(clientId: string): Promise<OnboardingData> {
  const [documents, openItems, stageEvents] = await Promise.all([
    supabase
      .from('documents')
      .select('id, doc_type, status, last_updated, signed_count, signatures_required')
      .eq('client_id', clientId),
    supabase
      .from('compliance_open_items')
      .select('id, category, status, title')
      .eq('client_id', clientId),
    supabase.from('stage_events').select('stage, completed_at').eq('client_id', clientId),
  ])

  const failure = documents.error ?? openItems.error ?? stageEvents.error
  if (failure) throw failure

  return {
    documents: documents.data ?? [],
    openItems: openItems.data ?? [],
    stageEvents: stageEvents.data ?? [],
  }
}

const focusRing =
  'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-background focus-visible:outline-none'

/** Primary pill on a light surface: hover deepens rather than thinning. */
const primaryPill =
  'inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 ' +
  `text-white transition-colors hover:bg-primary-dark ${focusRing}`

const quietLink =
  'inline-block rounded-full py-2 text-sm text-text/70 underline underline-offset-4 ' +
  `transition-colors hover:text-text focus-visible:text-text ${focusRing}`

/**
 * The Attention token reaches only 2.85:1 against `background`, so on this
 * surface it carries as a wash behind full-contrast text rather than as
 * coloured type — the light-surface counterpart of the Light Plate Rule.
 */
const attentionChip =
  'inline-block rounded-full bg-attention/15 px-3 py-1 text-sm text-text'

/** The heading that opens each band of the page. */
function SectionHeading({ children }: { children: string }) {
  return <h2 className="text-xl text-text">{children}</h2>
}

/* ---------------------------------------------------------------- 2. Questionnaire */

function QuestionnaireCard({
  state,
  dueDate,
}: {
  state: Exclude<QuestionnaireState, null>
  dueDate: string | null
}) {
  const card = 'rounded-3xl border border-border p-6 sm:p-8'

  if (state === 'submitted') {
    return (
      <section className={card}>
        <h2 className="text-xl text-text">Received — we’re reviewing it.</h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-text/70">
          Thanks for sending it through. We’ll follow up once we’ve been through your answers —
          there’s nothing further you need to do right now.
        </p>
      </section>
    )
  }

  const overdue = state === 'overdue'

  return (
    <section className={card}>
      <h2 className="text-xl text-text">Let’s get started</h2>
      <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-text/70">
        Your onboarding questionnaire tells us how your firm actually works, so everything that
        follows is built around it rather than around a template.
      </p>

      {dueDate ? (
        // Amber, never red: a form that has run past its date is something to
        // pick back up, not a failure of the client's.
        <p className="mt-4">
          {overdue ? (
            <span className={attentionChip}>Was due {dueDate}</span>
          ) : (
            <span className="text-sm text-text/70">Due {dueDate}</span>
          )}
        </p>
      ) : null}

      <Link to="/questionnaire" className={`mt-6 ${primaryPill}`}>
        Start the questionnaire
      </Link>
    </section>
  )
}

/* ------------------------------------------------------------- 3. Milestone tracker */

const MARKER_STYLES: Record<Milestone['state'], string> = {
  complete: 'bg-complete',
  current: 'bg-primary ring-4 ring-primary/15',
  upcoming: 'border border-border bg-background',
  management: 'border border-border bg-background',
}

function MilestoneTracker({ milestones }: { milestones: Milestone[] }) {
  return (
    <section>
      <SectionHeading>Onboarding milestones</SectionHeading>

      <ol className="mt-5">
        {milestones.map((milestone, index) => {
          const isLast = index === milestones.length - 1

          return (
            <li
              key={milestone.stage}
              className="flex gap-4"
              aria-current={milestone.state === 'current' ? 'step' : undefined}
            >
              <div className="flex flex-col items-center" aria-hidden="true">
                <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${MARKER_STYLES[milestone.state]}`} />
                {isLast ? null : <span className="w-px flex-1 bg-border" />}
              </div>

              <div className={isLast ? '' : 'pb-7'}>
                {milestone.state === 'current' ? (
                  <>
                    <p className="text-lg text-text">{milestone.label}</p>
                    <p className="mt-1 text-sm text-primary">Current stage</p>
                  </>
                ) : milestone.state === 'complete' ? (
                  <>
                    <p className="text-text/70">{milestone.label}</p>
                    {/* Completion dates only — never elapsed days or a countdown. */}
                    {milestone.completedOn ? (
                      <p className="mt-1 text-sm text-text/65">Completed {milestone.completedOn}</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="text-text/65">{milestone.label}</p>
                    {milestone.state === 'management' ? (
                      <p className="mt-1 text-sm text-text/65">{INCLUDED_WITH_MANAGEMENT}</p>
                    ) : null}
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/* ------------------------------------------------------------ 4. Progress indicator */

function ProgressBlock({ title, progress }: { title: string; progress: CategoryProgress }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base text-text">{title}</h3>
        <span className="text-base tabular-nums text-text/70">{progress.percent}%</span>
      </div>

      <div
        role="progressbar"
        aria-label={title}
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border"
      >
        <div
          className={`h-full rounded-full ${progress.percent === 100 ? 'bg-complete' : 'bg-primary'}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {progress.outstanding.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {progress.outstanding.map((item) => (
            <li key={item.id} className="flex items-start gap-3 text-sm">
              <span
                aria-hidden="true"
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  item.status === 'in_progress' ? 'bg-attention' : 'bg-text/35'
                }`}
              />
              <span className="text-text/70">
                {item.title}
                {item.status === 'in_progress' ? (
                  <span className="text-text/65"> · In progress</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function ProgressIndicator({
  insurance,
  compliance,
}: {
  insurance: CategoryProgress | null
  compliance: CategoryProgress | null
}) {
  // A category with no items renders as nothing at all, rather than as 0%.
  if (!insurance && !compliance) return null

  return (
    <section>
      <SectionHeading>Your progress</SectionHeading>
      <div className="mt-5 space-y-8">
        {/* Plain-language labels during onboarding. Regulator-compliance
            phrasing belongs to Management Mode, once the firm is there. */}
        {insurance ? <ProgressBlock title="Insurance Readiness" progress={insurance} /> : null}
        {compliance ? <ProgressBlock title="Compliance Progress" progress={compliance} /> : null}
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- 5. Document library */

function DocumentTile({ tile }: { tile: Tile }) {
  const notInPackage = tile.state === 'management'

  return (
    <li className="rounded-2xl border border-border px-5 py-4">
      <p className={notInPackage ? 'text-text/65' : 'text-text'}>{tile.label}</p>

      {tile.state === 'pending-signature' ? (
        <p className="mt-2">
          <span className={attentionChip}>{tile.signed}</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-text/65">
          {tile.state === 'management' ? INCLUDED_WITH_MANAGEMENT : (tile.completedOn ?? 'Available')}
        </p>
      )}
    </li>
  )
}

function DocumentLibrary({ documents, client }: { documents: DocumentRow[]; client: LibraryClient }) {
  const sections = buildDocumentSections(documents, client)

  return (
    <section>
      <SectionHeading>Documents</SectionHeading>

      {documents.length === 0 ? (
        <p className="mt-5 text-text/70">Your documents will appear here as they’re completed.</p>
      ) : (
        <div className="mt-5 space-y-8">
          {sections.map((section) => (
            <div key={section.name}>
              <h3 className="text-base text-text/70">{section.name}</h3>

              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {section.tiles.map((tile) => (
                  <DocumentTile key={tile.key} tile={tile} />
                ))}
              </ul>

              {section.viewAll ? (
                <Link to="/reports" className={`mt-4 inline-block ${quietLink}`}>
                  View all reports
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

type LibraryClient = Parameters<typeof buildDocumentSections>[1]

/* ------------------------------------------------------------------------ the page */

/**
 * The page itself, given data that is already resolved.
 *
 * Split from the route below purely so every seed client's render can be
 * exercised without a session or a database behind it.
 */
export function OnboardingView({
  client,
  data,
  onSignOut,
}: {
  client: ClientFacts
  data: OnboardingData
  onSignOut: () => void
}) {
  const stageLabel = STAGE_LABELS[client.onboardingStage - 1]
  const questionnaire = questionnaireState(client)

  return (
    <>
      <div className="flex justify-end">
        <button type="button" onClick={onSignOut} className={quietLink}>
          Sign out
        </button>
      </div>

      {/* 1. Header. tracking-normal because a firm's own name is user data. */}
      <header className="mt-6">
        <h1 className="text-2xl leading-tight tracking-normal break-words text-text sm:text-3xl">
          {client.companyName}
        </h1>
        <p className="mt-3 text-text/70">
          Stage {client.onboardingStage} of {STAGE_LABELS.length}
          {stageLabel ? ` — ${stageLabel}` : ''}
        </p>
      </header>

      <div className="mt-10 space-y-12">
        {questionnaire ? (
          <QuestionnaireCard
            state={questionnaire}
            dueDate={formatDateOnly(client.questionnaireDueDate)}
          />
        ) : null}

        <MilestoneTracker milestones={buildMilestones(client, data.stageEvents)} />

        {client.onboardingStage >= PROGRESS_FROM_STAGE ? (
          <ProgressIndicator
            insurance={categoryProgress(data.openItems, 'insurance')}
            compliance={categoryProgress(data.openItems, 'compliance')}
          />
        ) : null}

        <DocumentLibrary documents={data.documents} client={client} />
      </div>
    </>
  )
}

/** The page frame, so the surface is held identically while data resolves. */
export function OnboardingFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-2xl px-6 py-10 sm:px-8 sm:py-14">{children}</div>
    </main>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { client } = usePortal()
  const [data, setData] = useState<OnboardingData | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchOnboardingData(client.clientId).then(
      (result) => !cancelled && setData(result),
      () => !cancelled && setLoadFailed(true),
    )

    return () => {
      cancelled = true
    }
  }, [client.clientId])

  const signOut = () => {
    void supabase.auth.signOut().then(() => navigate('/login', { replace: true }))
  }

  if (loadFailed) {
    return (
      <OnboardingFrame>
        <p className="text-text/70">
          We couldn’t load your status just now. Please refresh the page, and contact us if it keeps
          happening.
        </p>
      </OnboardingFrame>
    )
  }

  // Holds the same surface rather than flashing a partial page.
  if (!data) return <OnboardingFrame>{null}</OnboardingFrame>

  return (
    <OnboardingFrame>
      <OnboardingView client={client} data={data} onSignOut={signOut} />
    </OnboardingFrame>
  )
}
