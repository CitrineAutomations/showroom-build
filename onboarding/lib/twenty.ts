import 'server-only'

const TWENTY_API_URL = process.env.TWENTY_API_URL
const TWENTY_API_KEY = process.env.TWENTY_API_KEY

if (!TWENTY_API_URL || !TWENTY_API_KEY) {
  throw new Error('TWENTY_API_URL and TWENTY_API_KEY must be set in .env.local')
}

const TWENTY_BASE_URL = TWENTY_API_URL.replace(/\/$/, '')

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${TWENTY_BASE_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TWENTY_API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Twenty API ${res.status}: ${res.statusText}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(`Twenty GQL: ${json.errors[0].message}`)
  return json.data as T
}

async function metadataGql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${TWENTY_BASE_URL}/metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TWENTY_API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Twenty metadata API ${res.status}: ${res.statusText}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(`Twenty metadata GQL: ${json.errors[0].message}`)
  return json.data as T
}

let attachmentFileFieldIdPromise: Promise<string> | null = null

async function loadAttachmentFileFieldMetadataId(): Promise<string> {
  const data = await metadataGql<{
    objects: { edges: { node: { nameSingular: string; fieldsList: { id: string; name: string }[] } }[] }
  }>(`
    query AttachmentFileField {
      objects(paging: { first: 200 }) {
        edges { node { nameSingular fieldsList { id name } } }
      }
    }
  `)
  const attachment = data.objects.edges.find(e => e.node.nameSingular === 'attachment')
  const field = attachment?.node.fieldsList.find(f => f.name === 'file')
  if (!field) throw new Error('Attachment file field metadata not found')
  return field.id
}

async function getAttachmentFileFieldMetadataId(): Promise<string> {
  if (!attachmentFileFieldIdPromise) {
    attachmentFileFieldIdPromise = loadAttachmentFileFieldMetadataId().catch(err => {
      attachmentFileFieldIdPromise = null
      throw err
    })
  }
  return attachmentFileFieldIdPromise
}

function toPhonesInput(phone: string) {
  const digits = phone.replace(/\D/g, '').slice(-10)
  return { primaryPhoneNumber: digits, primaryPhoneCallingCode: '+1', primaryPhoneCountryCode: 'US' }
}

export interface TwentyContact {
  id: string
  name: { firstName: string; lastName: string }
  emails: { primaryEmail: string }
  phones: { primaryPhoneNumber: string } | null
  clientType: string | null
  stripeCustomerId: string | null
}

export async function findContactByEmail(email: string): Promise<TwentyContact | null> {
  const data = await gql<{ people: { edges: { node: TwentyContact }[] } }>(`
    query FindByEmail($email: StringFilter!) {
      people(filter: { emails: { primaryEmail: { eq: $email } } }) {
        edges { node { id name { firstName lastName } emails { primaryEmail } phones { primaryPhoneNumber } clientType stripeCustomerId } }
      }
    }
  `, { email: { eq: email } })
  return data.people.edges[0]?.node ?? null
}

export async function searchContacts(query: string): Promise<TwentyContact[]> {
  const data = await gql<{ people: { edges: { node: TwentyContact }[] } }>(`
    query SearchContacts($filter: PersonFilterInput!) {
      people(filter: $filter, first: 10) {
        edges { node { id name { firstName lastName } emails { primaryEmail } phones { primaryPhoneNumber } clientType stripeCustomerId } }
      }
    }
  `, {
    filter: {
      or: [
        { name: { firstName: { ilike: `%${query}%` } } },
        { name: { lastName: { ilike: `%${query}%` } } },
        { emails: { primaryEmail: { ilike: `%${query}%` } } },
        { phones: { primaryPhoneNumber: { ilike: `%${query}%` } } },
      ],
    },
  })
  return data.people.edges.map(e => e.node)
}

export async function createContact(fullName: string, email: string, clientType: string, phone?: string): Promise<TwentyContact> {
  const [firstName, ...rest] = fullName.trim().split(' ')
  const lastName = rest.join(' ') || ''
  const data = await gql<{ createPerson: TwentyContact }>(`
    mutation CreateContact($input: PersonCreateInput!) {
      createPerson(data: $input) { id name { firstName lastName } emails { primaryEmail } phones { primaryPhoneNumber } clientType stripeCustomerId }
    }
  `, {
    input: {
      name: { firstName, lastName },
      emails: { primaryEmail: email },
      ...(phone ? { phones: toPhonesInput(phone) } : {}),
      clientType,
    },
  })
  return data.createPerson
}

export async function updateContact(id: string, patch: { clientType?: string; stripeCustomerId?: string; phone?: string }): Promise<void> {
  const { phone, ...rest } = patch
  const input: Record<string, unknown> = { ...rest }
  if (phone) {
    input.phones = toPhonesInput(phone)
  }
  if (patch.stripeCustomerId) {
    const stripeMode = patch.stripeCustomerId.startsWith('cus_') && process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')
      ? 'live' : 'test'
    input.stripeDashboardLink = {
      primaryLinkUrl: `https://dashboard.stripe.com/${stripeMode === 'test' ? 'test/' : ''}customers/${patch.stripeCustomerId}`,
      primaryLinkLabel: 'View in Stripe',
    }
  }
  await gql(`
    mutation UpdateContact($id: ID!, $input: PersonUpdateInput!) {
      updatePerson(id: $id, data: $input) { id }
    }
  `, { id, input })
}

export async function getActivePullForContact(contactId: string): Promise<{ id: string; returnDate: string; stage: string } | null> {
  const data = await gql<{ pulls: { edges: { node: { id: string; returnDate: string; stage: string } }[] } }>(`
    query ActivePull($filter: PullFilterInput!) {
      pulls(filter: $filter) { edges { node { id returnDate stage } } }
    }
  `, { filter: { clientId: { id: { eq: contactId } }, stage: { in: ['VISITED', 'OUT'] } } })
  return data.pulls.edges[0]?.node ?? null
}

// repAssigned intentionally left unset — no rep auth in onboarding yet (Clerk login planned separately).
// Reps must assign themselves on the Pull manually in Twenty until that ships.
export async function createPull(contactId: string, returnDate: string, clientName: string): Promise<{ id: string }> {
  const createdDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const name = `${clientName} - ${createdDate}`
  const data = await gql<{ createPull: { id: string } }>(`
    mutation CreatePull($input: PullCreateInput!) {
      createPull(data: $input) { id }
    }
  `, { input: { name, clientIdId: contactId, stage: 'VISITED', returnDate } })
  return data.createPull
}

export async function uploadFileToTwenty(arrayBuffer: ArrayBuffer, filename: string, mimeType: string): Promise<string> {
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await uploadFileToTwentyOnce(arrayBuffer, filename, mimeType)
    } catch (err) {
      lastError = err
      attachmentFileFieldIdPromise = null
    }
  }
  throw lastError
}

async function uploadFileToTwentyOnce(arrayBuffer: ArrayBuffer, filename: string, mimeType: string): Promise<string> {
  const fieldMetadataId = await getAttachmentFileFieldMetadataId()
  const uploadMutation = `
    mutation UploadFilesFieldFile($file: Upload!, $fieldMetadataId: String!) {
      uploadFilesFieldFile(file: $file, fieldMetadataId: $fieldMetadataId) { id }
    }
  `

  const formData = new FormData()
  formData.append(
    'operations',
    JSON.stringify({
      query: uploadMutation,
      variables: { file: null, fieldMetadataId },
    }),
  )
  formData.append('map', JSON.stringify({ '0': ['variables.file'] }))
  formData.append('0', new Blob([arrayBuffer], { type: mimeType }), filename)

  const res = await fetch(`${TWENTY_BASE_URL}/metadata`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TWENTY_API_KEY}` },
    body: formData,
  })
  const json = await res.json()
  if (!res.ok || json.errors?.length) {
    const message = json.errors?.[0]?.message ?? `HTTP ${res.status}`
    throw new Error(`Twenty file upload failed: ${message}`)
  }

  const fileId = json.data?.uploadFilesFieldFile?.id as string | undefined
  if (!fileId) throw new Error('Twenty file upload returned no file id')
  return fileId
}

export async function attachFilesToPull(pullId: string, fileIds: string[]): Promise<void> {
  for (const fileId of fileIds) {
    await gql(`
      mutation AttachFile($input: AttachmentCreateInput!) {
        createAttachment(data: $input) { id }
      }
    `, {
      input: {
        targetPullId: pullId,
        name: `photo-${fileId.slice(0, 8)}`,
        file: [{ fileId, label: 'Photo' }],
      },
    })
  }
}

export async function attachFilesToContact(contactId: string, fileIds: string[]): Promise<void> {
  for (const fileId of fileIds) {
    await gql(`
      mutation AttachFile($input: AttachmentCreateInput!) {
        createAttachment(data: $input) { id }
      }
    `, {
      input: {
        targetPersonId: contactId,
        name: `photo-${fileId.slice(0, 8)}`,
        file: [{ fileId, label: 'Photo' }],
      },
    })
  }
}
