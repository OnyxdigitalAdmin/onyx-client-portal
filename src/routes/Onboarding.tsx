import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DocumentLibrary, LIBRARY_ANCHOR_ID } from '../components/DocumentLibrary'
import { PortalHeader } from '../components/PortalHeader'
import { usePortal } from '../hooks/usePortal'
import type { LibraryDocumentRow } from '../lib/documents'
import type {
  CategoryProgress,
  ClientFacts,
  Milestone,
  OpenItemRow,
  QuestionnaireState,
  StageEventRow,
} from '../lib/onboarding'
import {
  applyAcknowledgments,
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
  documents: LibraryDocumentRow[]
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
      .select('id, doc_type, last_updated, all_employees_acknowledged, storage_path')
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
  'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-primary-dark focus-visible:outline-none'

const primaryPill =
  'inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 ' +
  `text-white transition-colors hover:bg-primary/85 ${focusRing}`

/**
 * Attention reaches only 4.0:1 against primary-dark, under the 4.5:1 floor for
 * text, so on this field it carries as a wash behind full-contrast white — the
 * Amber Wash Rule transposed to the dark surface. The flag stays amber and the
 * words stay readable.
 */
const attentionChip = 'inline-block rounded-full bg-attention/30 px-3 py-1 text-sm text-white'

/** The heading that opens each band of the page. */
function SectionHeading({ children }: { children: string }) {
  return <h2 className="text-xl text-white">{children}</h2>
}

/* ---------------------------------------------------------------- 2. Questionnaire */

function QuestionnaireCard({
  state,
  dueDate,
}: {
  state: Exclude<QuestionnaireState, null>
  dueDate: string | null
}) {
  const card = 'rounded-3xl border border-white/20 bg-white/[0.04] p-6 sm:p-8'

  if (state === 'submitted') {
    return (
      <section className={card}>
        <h2 className="text-xl text-white">Received — we’re reviewing it.</h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-white/80">
          Thanks for sending it through. We’ll follow up once we’ve been through your answers —
          there’s nothing further you need to do right now.
        </p>
      </section>
    )
  }

  const overdue = state === 'overdue'

  return (
    <section className={card}>
      <h2 className="text-xl text-white">Let’s get started</h2>
      <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-white/80">
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
            <span className="text-sm text-white/80">Due {dueDate}</span>
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

function CheckMark() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 text-white">
      <path
        d="m4 10.5 4 4 8-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Three states, and no colour carries meaning in any of them: a completed
 * stage is a white check, the current stage is an open ring labelled "In
 * progress", and a stage still ahead has no marker at all. Green dots are
 * gone — a tick is legible without needing a legend.
 */
function MilestoneTracker({ milestones }: { milestones: Milestone[] }) {
  return (
    <section>
      <SectionHeading>Onboarding milestones</SectionHeading>

      <ol className="mt-5">
        {milestones.map((milestone, index) => {
          const isLast = index === milestones.length - 1
          const complete = milestone.state === 'complete'
          const current = milestone.state === 'current'

          return (
            <li
              key={milestone.stage}
              className="flex gap-4"
              aria-current={current ? 'step' : undefined}
            >
              <div className="flex w-5 flex-col items-center" aria-hidden="true">
                {complete ? (
                  <CheckMark />
                ) : current ? (
                  <span className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-white" />
                ) : (
                  <span className="mt-0.5 size-4 shrink-0" />
                )}
                {isLast ? null : <span className="mt-1 w-px flex-1 bg-white/25" />}
              </div>

              <div className={isLast ? '' : 'pb-7'}>
                {current ? (
                  <>
                    <p className="text-lg text-white">{milestone.label}</p>
                    <p className="mt-1 text-sm text-white/80">In progress</p>
                  </>
                ) : complete ? (
                  <>
                    <p className="text-white">{milestone.label}</p>
                    {/* Completion dates only — never elapsed days or a countdown. */}
                    {milestone.completedOn ? (
                      <p className="mt-1 text-sm text-white/70">
                        Completed {milestone.completedOn}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="text-white/65">{milestone.label}</p>
                    {milestone.state === 'management' ? (
                      <p className="mt-1 text-sm text-white/65">{INCLUDED_WITH_MANAGEMENT}</p>
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
        <h3 className="text-base text-white">{title}</h3>
        <span className="text-base tabular-nums text-white">{progress.percent}%</span>
      </div>

      <div
        role="progressbar"
        aria-label={title}
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20"
      >
        <div className="h-full rounded-full bg-white" style={{ width: `${progress.percent}%` }} />
      </div>

      {/* Every item, complete or not — the percentage above is exactly the
          ticks below over the total, and a client can check it by counting. */}
      <ul className="mt-4 space-y-2.5">
        {progress.items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 text-sm">
            <span aria-hidden="true" className="mt-px w-5 shrink-0">
              {item.complete ? <CheckMark /> : null}
            </span>
            <span className={item.complete ? 'text-white' : 'text-white/80'}>
              {item.title}
              <span className="sr-only">{item.complete ? ' — complete' : ' — not yet complete'}</span>
            </span>
          </li>
        ))}
      </ul>
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

/* ------------------------------------------------------------------------ the page */

/**
 * The page itself, given data that is already resolved.
 *
 * Split from the route below purely so every seed client's render can be
 * exercised without a session or a database behind it.
 */
export function OnboardingView({
  client,
  clientId,
  role,
  vciso,
  data,
  onSignOut,
}: {
  client: ClientFacts
  clientId: string
  role: string | null
  vciso: { name: string | null; contact: string | null }
  data: OnboardingData
  onSignOut: () => void
}) {
  const stageLabel = STAGE_LABELS[client.onboardingStage - 1]
  const questionnaire = questionnaireState(client)
  // One boolean per document drives both the checklist line and the library
  // row, so the two can never disagree about the same fact.
  const openItems = applyAcknowledgments(data.openItems, data.documents)

  return (
    <>
      <PortalHeader
        companyName={client.companyName}
        vciso={vciso}
        onSignOut={onSignOut}
        onOpenDocuments={() =>
          document.getElementById(LIBRARY_ANCHOR_ID)?.scrollIntoView({ behavior: 'smooth' })
        }
      />

      <div className="mx-auto w-full max-w-2xl pt-8 pb-16">
        <p className="px-6 text-white/80">
          Stage {client.onboardingStage} of {STAGE_LABELS.length}
          {stageLabel ? ` — ${stageLabel}` : ''}
        </p>

        <div className="mt-8 space-y-12 px-6">
          {questionnaire ? (
            <QuestionnaireCard
              state={questionnaire}
              dueDate={formatDateOnly(client.questionnaireDueDate)}
            />
          ) : null}

          <MilestoneTracker milestones={buildMilestones(client, data.stageEvents)} />

          {client.onboardingStage >= PROGRESS_FROM_STAGE ? (
            <ProgressIndicator
              insurance={categoryProgress(openItems, 'insurance')}
              compliance={categoryProgress(openItems, 'compliance')}
            />
          ) : null}
        </div>

        {/* Full column width rather than inset: the library's rules are the
            file-cabinet, and an indented cabinet stops reading as one. */}
        <div className="mt-14">
          <DocumentLibrary
            documents={data.documents}
            companyName={client.companyName}
            clientId={clientId}
            role={role}
          />
        </div>
      </div>
    </>
  )
}

/** The page frame, so the surface is held identically while data resolves. */
export function OnboardingFrame({ children }: { children: ReactNode }) {
  return <main className="min-h-dvh bg-primary-dark">{children}</main>
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
        <p className="mx-auto max-w-2xl px-6 py-16 text-white/80">
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
      <OnboardingView
        client={client}
        clientId={client.clientId}
        role={client.role}
        vciso={{ name: client.vcisoName, contact: client.vcisoContact }}
        data={data}
        onSignOut={signOut}
      />
    </OnboardingFrame>
  )
}
