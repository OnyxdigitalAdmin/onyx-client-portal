import { useOutletContext } from 'react-router-dom'
import type { ClientContext } from '../lib/clientContext'

/** Resolved once by PortalLayout and shared with every screen beneath it. */
export type PortalContext = { client: ClientContext }

export function usePortal(): PortalContext {
  return useOutletContext<PortalContext>()
}
