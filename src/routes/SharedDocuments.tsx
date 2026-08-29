import { BrandField } from '../components/BrandField'

/**
 * The recipient's landing point for a share link.
 *
 * Deliberately not built — the recipient-facing page is designed separately.
 * The route exists now so a generated link resolves to a page that never asks
 * the recipient for a session: an insurer or an examiner has no account here,
 * and routing them into sign-in would make the link useless the day it lands.
 */
export default function SharedDocuments() {
  return (
    <BrandField compact>
      <p className="mt-10 max-w-[26rem] text-center leading-relaxed text-white">
        This shared document link is being prepared. Please contact the firm that sent it to you,
        or Onyx Digital, if you need these documents right away.
      </p>
    </BrandField>
  )
}
