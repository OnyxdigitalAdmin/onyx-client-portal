import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LaunchGate from './routes/LaunchGate'
import Login from './routes/Login'
import Mfa from './routes/Mfa'
import SharedDocuments from './routes/SharedDocuments'
import VerifyEmail from './routes/VerifyEmail'
import { ManagementMode } from './routes/ModePlaceholder'
import PortalLayout from './routes/PortalLayout'
import Welcome from './routes/Welcome'

/**
 * Split out because it carries the document library, and the library carries
 * pdf.js — roughly 900 kB that the sign-in sequence has no use for. Holding
 * the same primary-dark field while the chunk arrives keeps the transition
 * from flashing white.
 */
const Onboarding = lazy(() => import('./routes/Onboarding'))

/**
 * Route table.
 *
 * The pre-auth sequence (launch → email → code → authenticator) is public; every
 * screen from the welcome hold onward sits under PortalLayout, which holds
 * the session guard and the idle timeout.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LaunchGate />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/mfa" element={<Mfa />} />

      {/* Recipient-facing and session-independent by design: a share link has
          to work for someone who has no account here. */}
      <Route path="/share/:token" element={<SharedDocuments />} />

      <Route element={<PortalLayout />}>
        <Route path="/welcome" element={<Welcome />} />
        <Route
          path="/onboarding"
          element={
            <Suspense fallback={<div className="min-h-dvh bg-primary-dark" />}>
              <Onboarding />
            </Suspense>
          }
        />
        <Route path="/management" element={<ManagementMode />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
