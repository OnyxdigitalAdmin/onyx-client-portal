import { Navigate, Route, Routes } from 'react-router-dom'
import LaunchGate from './routes/LaunchGate'
import Login from './routes/Login'
import Mfa from './routes/Mfa'
import { ManagementMode, OnboardingMode } from './routes/ModePlaceholder'
import PortalLayout from './routes/PortalLayout'
import Welcome from './routes/Welcome'

/**
 * Phase 1 route table.
 *
 * The pre-auth sequence (launch → login → second factor) is public; every
 * screen from the welcome hold onward sits under PortalLayout, which holds
 * the session guard and the idle timeout.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LaunchGate />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mfa" element={<Mfa />} />

      <Route element={<PortalLayout />}>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/onboarding" element={<OnboardingMode />} />
        <Route path="/management" element={<ManagementMode />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
