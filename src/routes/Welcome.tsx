import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandField } from '../components/BrandField'
import { ONBOARDING_COMPLETE_STAGE } from '../lib/clientContext'
import { usePortal } from '../hooks/usePortal'

const HOLD_MS = 2000

export default function Welcome() {
  const navigate = useNavigate()
  const { client } = usePortal()

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      navigate(
        client.onboardingStage >= ONBOARDING_COMPLETE_STAGE ? '/management' : '/onboarding',
        { replace: true },
      )
    }, HOLD_MS)

    return () => window.clearTimeout(timeout)
  }, [client.onboardingStage, navigate])

  return (
    <BrandField>
      <div className="mt-8 text-center">
        {/* Fixed design copy carries the brand letter-spacing; the company
            name is user data and sits at normal tracking. The greeting leads at
            a larger size than the name it introduces, and the name is inset so
            a long firm name wraps inside the column instead of running to the
            gutters. */}
        <p className="text-[2.0625rem] tracking-brand text-white/75">Welcome aboard,</p>
        <p className="mt-1 px-[46px] text-[1.75rem] tracking-normal text-white">
          {client.companyName}
        </p>
      </div>
    </BrandField>
  )
}
