import 'server-only'

const N8N_CLOUD_URL = process.env.N8N_CLOUD_URL
const ONBOARDING_WEBHOOK_SECRET = process.env.ONBOARDING_WEBHOOK_SECRET

if (!N8N_CLOUD_URL || !ONBOARDING_WEBHOOK_SECRET) {
  throw new Error('N8N_CLOUD_URL and ONBOARDING_WEBHOOK_SECRET must be set in .env.local')
}

const WEBHOOK_URL = `${N8N_CLOUD_URL.replace(/\/$/, '')}/webhook/onboarding-complete`
const WEBHOOK_SECRET = ONBOARDING_WEBHOOK_SECRET

export async function createPortalAccount(input: {
  contactId: string
  email: string
  firstName: string
  lastName: string
}): Promise<void> {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AUTO-11 webhook ${res.status}: ${text || res.statusText}`)
  }
}
