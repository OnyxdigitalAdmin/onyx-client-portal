import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { usePortal } from '../hooks/usePortal'

/**
 * Stand-in for Management Mode, which Phase 3 builds.
 *
 * It only names the mode and the company. The sign-out is here purely so the
 * session has a way out while the real screen doesn't exist yet.
 */
export function ModePlaceholder({ mode }: { mode: 'Management' }) {
  const navigate = useNavigate()
  const { client } = usePortal()

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6">
      <h1 className="text-center text-2xl text-text">
        {mode} Mode — {client.companyName}
      </h1>

      <button
        type="button"
        onClick={() => {
          void supabase.auth.signOut().then(() => navigate('/login', { replace: true }))
        }}
        className={[
          'rounded-full text-sm text-text/60 underline underline-offset-4',
          'transition-colors hover:text-text',
          'focus-visible:text-text focus-visible:ring-2 focus-visible:ring-primary',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        ].join(' ')}
      >
        Sign out
      </button>
    </main>
  )
}

export function ManagementMode() {
  return <ModePlaceholder mode="Management" />
}
