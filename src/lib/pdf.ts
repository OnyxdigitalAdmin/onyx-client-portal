import { pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { supabase } from './supabaseClient'

// Vite resolves this to a hashed asset at build time; pdf.js runs its parser
// off the main thread, which is what keeps a 60-page document scrollable.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

/** Long enough to fetch the file, short enough that a leaked URL is worthless. */
const SIGNED_URL_TTL_SECONDS = 60

/**
 * Pulls a document out of the private `documents` bucket and hands back a blob
 * URL for it.
 *
 * A blob rather than the signed URL itself for two reasons: it is same-origin,
 * so printing can drive an iframe's own print dialog, and it outlives the
 * 60-second signature, so a long read doesn't expire mid-scroll. The caller
 * owns the URL and must revoke it.
 */
export async function fetchDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) throw error ?? new Error('Could not sign document URL')

  const response = await fetch(data.signedUrl)
  if (!response.ok) throw new Error(`Document fetch failed with ${response.status}`)

  return URL.createObjectURL(await response.blob())
}

/** Saves a blob URL to the user's device. Clients download; they never upload. */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
}

/** A filename the client will recognise in their downloads folder. */
export function documentFilename(companyName: string, docName: string): string {
  const slug = (value: string) => value.replace(/[^A-Za-z0-9]+/g, '')
  return `OnyxDigital_${slug(docName)}_${slug(companyName)}.pdf`
}
