import type { ClientFacts } from './onboarding'
import { supabase } from './supabaseClient'

/** The signed-in user's company, resolved through the client_users link. */
export type ClientContext = ClientFacts & { clientId: string }

/** onboarding_stage runs 1-6; 6 means onboarding is complete. */
export const ONBOARDING_COMPLETE_STAGE = 6

type ClientRow = {
  company_name: string
  onboarding_stage: number
  vertical: string | null
  package: string | null
  questionnaire_due_date: string | null
  questionnaire_submitted_at: string | null
  questionnaire_approved_at: string | null
}

const CLIENT_COLUMNS =
  'company_name, onboarding_stage, vertical, package, ' +
  'questionnaire_due_date, questionnaire_submitted_at, questionnaire_approved_at' 

/**
 * Resolves the signed-in user to their client company.
 *
 * Returns null when the account exists in auth but has no client_users row —
 * a provisioning mistake, not a normal state. Callers surface that as a real
 * error and sign the user out rather than landing them on an empty portal.
 */
export async function fetchClientContext(): Promise<ClientContext | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const user = userData?.user
  if (userError || !user) return null

  const { data, error } = await supabase
    .from('client_users')
    .select(`client_id, clients(${CLIENT_COLUMNS})`)
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  // PostgREST returns the embedded to-one row as an object, but tolerate an
  // array shape so a relationship change here can't blank the welcome screen.
  const client: ClientRow | undefined = Array.isArray(data.clients)
    ? data.clients[0]
    : data.clients

  if (!client?.company_name) return null

  return {
    clientId: data.client_id,
    companyName: client.company_name,
    onboardingStage: client.onboarding_stage,
    vertical: client.vertical,
    package: client.package,
    questionnaireDueDate: client.questionnaire_due_date,
    questionnaireSubmittedAt: client.questionnaire_submitted_at,
    questionnaireApprovedAt: client.questionnaire_approved_at,
  }
}
