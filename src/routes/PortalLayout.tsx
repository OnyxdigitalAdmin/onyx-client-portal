import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { BrandField } from '../components/BrandField'
import { SessionTimeoutModal } from '../components/SessionTimeoutModal'
import { useIdleTimeout } from '../hooks/useIdleTimeout'
import type { PortalContext } from '../hooks/usePortal'
import type { ClientContext } from '../lib/clientContext'
import { fetchClientContext } from '../lib/clientContext'
import { supabase } from '../lib/supabaseClient'
import type { LoginState } from './Login'

/**
 * Guards every screen shown after sign-in: confirms the session, resolves the
 * user's company once for its children, and runs the idle-session timeout.
 *
 * Resolving the company here rather than per-screen means the "account isn't
 * linked to a company" case is handled in exactly one place, and a refresh
 * deep into the portal still knows who the user is.
 */
export default function PortalLayout() {
  const navigate = useNavigate()
  const [client, setClient] = useState<ClientContext | null>(null)

  const signOutTo = useCallback(
    async (state: LoginState) => {
      await supabase.auth.signOut()
      navigate('/login', { replace: true, state })
    },
    [navigate],
  )

  const handleIdleExpiry = useCallback(() => {
    void signOutTo({
      notice: 'You were signed out after 5 minutes of inactivity. Please sign in again.',
    })
  }, [signOutTo])

  const { warning, secondsLeft, staySignedIn } = useIdleTimeout(handleIdleExpiry)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      if (!data.session) {
        navigate('/login', { replace: true })
        return
      }

      const context = await fetchClientContext()
      if (cancelled) return

      if (!context) {
        // Authenticated but unlinked: a provisioning mistake, not a state the
        // client can resolve. Say so plainly and don't leave them in an empty
        // portal.
        await signOutTo({
          error:
            'This account isn’t linked to a company yet. Please contact Onyx Digital and we’ll finish setting it up.',
        })
        return
      }

      setClient(context)
    }

    void resolve()

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') navigate('/login', { replace: true })
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [navigate, signOutTo])

  // Holds the brand field while resolving, so arriving from the authenticating
  // screen never flashes a blank white page.
  if (!client) return <BrandField />

  return (
    <>
      <Outlet context={{ client } satisfies PortalContext} />
      {warning ? (
        <SessionTimeoutModal secondsLeft={secondsLeft} onStaySignedIn={staySignedIn} />
      ) : null}
    </>
  )
}
