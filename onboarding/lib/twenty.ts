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

const fileFieldIdPromises = new Map<string, Promise<string>>()

async function loadFileFieldMetadataId(objectName: string, fieldName: string): Promise<string> {
  const data = await metadataGql<{
    objects: { edges: { node: { nameSingular: string; fieldsList: { id: string; name: string }[] } }[] }
  }>(`
    query FileField {
      objects(paging: { first: 200 }) {
        edges { node { nameSingular fieldsList { id name } } }
      }
    }
  `)
  const object = data.objects.edges.find(e => e.node.nameSingular === objectName)
  const field = object?.node.fieldsList.find(f => f.name === fieldName)
  if (!field) throw new Error(`${objectName}.${fieldName} field metadata not found`)
  return field.id
}

async function getFileFieldMetadataId(objectName: string, fieldName: string): Promise<string> {
  const key = `${objectName}.${fieldName}`
  let promise = fileFieldIdPromises.get(key)
  if (!promise) {
    promise = loadFileFieldMetadataId(objectName, fieldName).catch(err => {
      fileFieldIdPromises.delete(key)
      throw err
    })
    fileFieldIdPromises.set(key, promise)
  }
  return promise
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
    query FindByEmail($email: String!) {
      people(filter: { emails: { primaryEmail: { eq: $email } } }) {
        edges { node { id name { firstName lastName } emails { primaryEmail } phones { primaryPhoneNumber } clientType stripeCustomerId } }
      }
    }
  `, { email })
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

export interface PullPhoto {
  id: string
  name: string
  url: string
}

export async function getActivePullForContact(contactId: string): Promise<{ id: string; returnDate: string; stage: string; photos: PullPhoto[] } | null> {
  const data = await gql<{ pulls: { edges: { node: {
    id: string
    returnDate: string
    stage: string
    attachments: { edges: { node: { id: string; name: string; file: { url: string }[] } }[] }
  } }[] } }>(`
    query ActivePull($filter: PullFilterInput!) {
      pulls(filter: $filter) {
        edges {
          node {
            id
            returnDate
            stage
            attachments {
              edges { node { id name file } }
            }
          }
        }
      }
    }
  `, { filter: { clientId: { id: { eq: contactId } }, stage: { in: ['VISITED', 'OUT', 'DUE_SOON', 'OVERDUE'] } } })
  const node = data.pulls.edges[0]?.node
  if (!node) return null
  return {
    id: node.id,
    returnDate: node.returnDate,
    stage: node.stage,
    photos: node.attachments.edges
      .filter(e => e.node.file[0]?.url)
      .map(e => ({
        id: e.node.id,
        name: e.node.name,
        url: e.node.file[0].url,
      })),
  }
}

export interface PullItem {
  loanId: string
  inventoryItemId: string
  itemId: string
  designer: string
  itemType: string
  color: string
  outcome: string | null
}

export interface OpenPullSummary {
  id: string
  returnDate: string
  stage: string
  client: {
    id: string
    name: { firstName: string; lastName: string }
    emails: { primaryEmail: string }
    phones: { primaryPhoneNumber: string } | null
  }
}

export async function listOpenPulls(): Promise<OpenPullSummary[]> {
  const data = await gql<{ pulls: { edges: { node: {
    id: string
    returnDate: string
    stage: string
    clientId: OpenPullSummary['client'] | null
  } }[] } }>(`
    query OpenPulls($filter: PullFilterInput!) {
      pulls(filter: $filter, first: 200) {
        edges {
          node {
            id
            returnDate
            stage
            clientId {
              id
              name { firstName lastName }
              emails { primaryEmail }
              phones { primaryPhoneNumber }
            }
          }
        }
      }
    }
  `, { filter: { stage: { in: ['VISITED', 'OUT', 'DUE_SOON', 'OVERDUE'] } } })
  const summaries: (OpenPullSummary | null)[] = data.pulls.edges.map(e => {
    if (!e.node.clientId) return null
    return { id: e.node.id, returnDate: e.node.returnDate, stage: e.node.stage, client: e.node.clientId }
  })
  return summaries.filter((s): s is OpenPullSummary => s !== null)
}

interface PullItemLoanNode {
  id: string
  outcome: string | null
  inventoryItem: { id: string; itemId: string; designer: string; itemType: string; color: string }
}

export async function getOpenPullForContact(contactId: string): Promise<{ id: string; returnDate: string; stage: string; items: PullItem[] } | null> {
  const data = await gql<{ pulls: { edges: { node: {
    id: string
    returnDate: string
    stage: string
    pullItemLoans: { edges: { node: PullItemLoanNode }[] }
  } }[] } }>(`
    query OpenPull($filter: PullFilterInput!) {
      pulls(filter: $filter) {
        edges {
          node {
            id
            returnDate
            stage
            pullItemLoans {
              edges { node { id outcome inventoryItem { id itemId designer itemType color } } }
            }
          }
        }
      }
    }
  `, { filter: { clientId: { id: { eq: contactId } }, stage: { in: ['VISITED', 'OUT', 'DUE_SOON', 'OVERDUE'] } } })
  const node = data.pulls.edges[0]?.node
  if (!node) return null
  return {
    id: node.id,
    returnDate: node.returnDate,
    stage: node.stage,
    items: node.pullItemLoans.edges.map(e => ({
      loanId: e.node.id,
      inventoryItemId: e.node.inventoryItem.id,
      itemId: e.node.inventoryItem.itemId,
      designer: e.node.inventoryItem.designer,
      itemType: e.node.inventoryItem.itemType,
      color: e.node.inventoryItem.color,
      outcome: e.node.outcome,
    })),
  }
}

export type ItemCondition = 'AVAILABLE' | 'DAMAGED' | 'LOST'

export async function returnPullItems(
  pullId: string,
  items: { loanId: string; inventoryItemId: string; condition: ItemCondition; conditionNotes?: string }[],
): Promise<{ stage: string }> {
  for (const { loanId, inventoryItemId, condition, conditionNotes } of items) {
    await gql(`
      mutation UpdatePullItemLoan($id: ID!, $input: PullItemLoanUpdateInput!) {
        updatePullItemLoan(id: $id, data: $input) { id outcome }
      }
    `, { id: loanId, input: { outcome: condition, ...(conditionNotes ? { conditionNotes } : {}) } })

    await gql(`
      mutation UpdateInventoryItem($id: ID!, $input: InventoryItemUpdateInput!) {
        updateInventoryItem(id: $id, data: $input) { id status }
      }
    `, { id: inventoryItemId, input: { status: condition } })
  }

  const pull = await getPullItemsById(pullId)
  const allAccountedFor = pull.items.every(item => item.outcome !== null)

  if (allAccountedFor) {
    await gql(`
      mutation UpdatePull($id: ID!, $input: PullUpdateInput!) {
        updatePull(id: $id, data: $input) { id stage }
      }
    `, { id: pullId, input: { stage: 'RETURNED' } })
    return { stage: 'RETURNED' }
  }

  return { stage: pull.stage }
}

async function getPullItemsById(pullId: string): Promise<{ stage: string; items: PullItem[] }> {
  const data = await gql<{ pull: { stage: string; pullItemLoans: { edges: { node: PullItemLoanNode }[] } } }>(`
    query PullItemsById($id: ID!) {
      pull(filter: { id: { eq: $id } }) {
        stage
        pullItemLoans {
          edges { node { id outcome inventoryItem { id itemId designer itemType color } } }
        }
      }
    }
  `, { id: pullId })
  return {
    stage: data.pull.stage,
    items: data.pull.pullItemLoans.edges.map(e => ({
      loanId: e.node.id,
      inventoryItemId: e.node.inventoryItem.id,
      itemId: e.node.inventoryItem.itemId,
      designer: e.node.inventoryItem.designer,
      itemType: e.node.inventoryItem.itemType,
      color: e.node.inventoryItem.color,
      outcome: e.node.outcome,
    })),
  }
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

export async function markPullOut(pullId: string): Promise<void> {
  await gql(`
    mutation UpdatePull($id: ID!, $input: PullUpdateInput!) {
      updatePull(id: $id, data: $input) { id stage }
    }
  `, { id: pullId, input: { stage: 'OUT' } })
}

export async function uploadFileToTwenty(
  arrayBuffer: ArrayBuffer,
  filename: string,
  mimeType: string,
  target: { objectName: string; fieldName: string } = { objectName: 'attachment', fieldName: 'file' },
): Promise<string> {
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await uploadFileToTwentyOnce(arrayBuffer, filename, mimeType, target)
    } catch (err) {
      lastError = err
      fileFieldIdPromises.delete(`${target.objectName}.${target.fieldName}`)
    }
  }
  throw lastError
}

async function uploadFileToTwentyOnce(
  arrayBuffer: ArrayBuffer,
  filename: string,
  mimeType: string,
  target: { objectName: string; fieldName: string },
): Promise<string> {
  const fieldMetadataId = await getFileFieldMetadataId(target.objectName, target.fieldName)
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

// Twenty's InventoryItem.season enum is a fixed, manually-curated list that may lag behind
// the calendar (e.g. it may not yet define a season for the current half-year). Ordered
// oldest-to-newest so a computed season with no exact match falls back to the closest earlier one.
const KNOWN_SEASONS = [
  'SS_2023', 'FW_2023', 'SS_2024', 'FW_2024',
  'RESORT_2025', 'SS_2025', 'FW_2025', 'RESORT_2026', 'SS_2026',
]

function currentSeasonCode(): { seasonEnum: string; seasonCode: string } {
  const now = new Date()
  const year = now.getFullYear()
  const isSpringSummer = now.getMonth() < 6 // Jan-Jun -> SS, Jul-Dec -> FW
  const computed = isSpringSummer ? `SS_${year}` : `FW_${year}`
  const seasonEnum = KNOWN_SEASONS.includes(computed)
    ? computed
    : KNOWN_SEASONS[KNOWN_SEASONS.length - 1]
  const [prefix, seasonYear] = seasonEnum.split('_')
  const seasonCode = `${prefix.slice(0, 2)}${seasonYear.slice(-2)}`
  return { seasonEnum, seasonCode }
}

interface FieldOption {
  value: string
  label: string
  color?: string
  position?: number
}

let itemTypeFieldMetadataIdPromise: Promise<{ id: string; options: FieldOption[] }> | null = null

async function loadItemTypeFieldMetadata(): Promise<{ id: string; options: FieldOption[] }> {
  const data = await metadataGql<{
    objects: { edges: { node: { nameSingular: string; fields: { edges: { node: { id: string; name: string; options: FieldOption[] | null } }[] } } }[] }
  }>(`
    query ItemTypeField {
      objects(paging: { first: 200 }) {
        edges { node { nameSingular fields(paging: { first: 100 }) { edges { node { id name options } } } } }
      }
    }
  `)
  const inventoryItem = data.objects.edges.find(e => e.node.nameSingular === 'inventoryItem')
  const field = inventoryItem?.node.fields.edges.find(e => e.node.name === 'itemType')
  if (!field) throw new Error('inventoryItem.itemType field metadata not found')
  return { id: field.node.id, options: field.node.options ?? [] }
}

async function getItemTypeFieldMetadata(forceRefresh = false): Promise<{ id: string; options: FieldOption[] }> {
  if (forceRefresh || !itemTypeFieldMetadataIdPromise) {
    itemTypeFieldMetadataIdPromise = loadItemTypeFieldMetadata().catch(err => {
      itemTypeFieldMetadataIdPromise = null
      throw err
    })
  }
  return itemTypeFieldMetadataIdPromise
}

export async function getItemTypeOptions(): Promise<{ label: string; value: string }[]> {
  const { options } = await getItemTypeFieldMetadata()
  return options
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(o => ({ label: o.label, value: o.value }))
}

function toEnumValue(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const OPTION_COLORS = ['pink', 'purple', 'blue', 'gray', 'orange', 'yellow', 'brown', 'green', 'red', 'turquoise', 'sky']

export async function ensureItemTypeOption(label: string): Promise<string> {
  const value = toEnumValue(label)
  if (!value) throw new Error('Item type must contain at least one letter or number')
  const { id, options } = await getItemTypeFieldMetadata()
  if (options.some(o => o.value === value)) return value

  const updatedOptions = [...options, { label, value, color: OPTION_COLORS[options.length % OPTION_COLORS.length], position: options.length }]

  try {
    await metadataGql(`
      mutation UpdateItemTypeField($id: UUID!, $input: UpdateFieldInput!) {
        updateOneField(input: { id: $id, update: $input }) { id options }
      }
    `, { id, input: { options: updatedOptions } })
  } catch (err) {
    const { options: freshOptions } = await getItemTypeFieldMetadata(true)
    if (freshOptions.some(o => o.value === value)) return value
    throw err
  }

  await getItemTypeFieldMetadata(true)
  return value
}

function designerInitials(designer: string): string {
  const initials = designer
    .split(/\s+/)
    .map(word => word.replace(/[^a-zA-Z]/g, '').charAt(0))
    .filter(Boolean)
    .join('')
    .toUpperCase()
  return initials || 'XX'
}

export async function createInventoryItem(
  designer: string,
  color: string,
  itemTypeLabel: string,
  sequence: number,
  fileIds: string[] = [],
): Promise<{ id: string; itemId: string }> {
  const { seasonEnum, seasonCode } = currentSeasonCode()
  const random = Math.floor(100 + Math.random() * 900)
  const sequenceCode = String(sequence).padStart(3, '0')
  const itemId = `${designerInitials(designer)}-${random}-${seasonCode}-${sequenceCode}`
  const itemType = await ensureItemTypeOption(itemTypeLabel)

  const data = await gql<{ createInventoryItem: { id: string } }>(`
    mutation CreateInventoryItem($input: InventoryItemCreateInput!) {
      createInventoryItem(data: $input) { id }
    }
  `, {
    input: {
      itemId,
      designer,
      color,
      itemType,
      season: seasonEnum,
      status: 'OUT',
      ...(fileIds.length ? { itemImages: fileIds.map(fileId => ({ fileId, label: 'Photo' })) } : {}),
    },
  })
  return { ...data.createInventoryItem, itemId }
}

export async function deleteInventoryItem(inventoryItemId: string): Promise<void> {
  await gql(`
    mutation DeleteInventoryItem($id: ID!) {
      deleteInventoryItem(id: $id) { id }
    }
  `, { id: inventoryItemId })
}

export async function addInventoryItemImagesIfMissing(
  inventoryItemId: string,
  fileIds: string[],
): Promise<void> {
  if (!fileIds.length) return

  const data = await gql<{ inventoryItem: { itemImages: { fileId: string }[] | null } | null }>(`
    query InventoryItemImages($id: ID!) {
      inventoryItem(filter: { id: { eq: $id } }) { itemImages { fileId } }
    }
  `, { id: inventoryItemId })

  const existing = data.inventoryItem?.itemImages ?? []
  const existingIds = new Set(existing.map(img => img.fileId))
  const newFileIds = fileIds.filter(fileId => !existingIds.has(fileId))
  if (!newFileIds.length) return

  await gql(`
    mutation UpdateInventoryItemImages($id: ID!, $input: InventoryItemUpdateInput!) {
      updateInventoryItem(id: $id, data: $input) { id }
    }
  `, {
    id: inventoryItemId,
    input: {
      itemImages: [
        ...existing.map(img => ({ fileId: img.fileId, label: 'Photo' })),
        ...newFileIds.map(fileId => ({ fileId, label: 'Photo' })),
      ],
    },
  })
}

export async function getInventoryItemIdentifier(inventoryItemId: string): Promise<string> {
  const data = await gql<{ inventoryItem: { itemId: string } | null }>(`
    query InventoryItemIdentifier($id: ID!) {
      inventoryItem(filter: { id: { eq: $id } }) { itemId }
    }
  `, { id: inventoryItemId })
  return data.inventoryItem?.itemId ?? inventoryItemId
}

export interface InventoryItemSearchResult {
  id: string
  designer: string
  color: string
  itemType: string
  status: string
  lastRentedAt: string | null
  lastOutcome: string | null
}

export async function searchInventoryItems(query: string): Promise<InventoryItemSearchResult[]> {
  const data = await gql<{ inventoryItems: { edges: { node: {
    id: string
    designer: string
    color: string
    itemType: string
    status: string
    pullItemLoans: { edges: { node: { createdAt: string; outcome: string | null } }[] }
  } }[] } }>(`
    query SearchInventoryItems($filter: InventoryItemFilterInput!) {
      inventoryItems(filter: $filter, first: 20) {
        edges {
          node {
            id designer color itemType status
            pullItemLoans(first: 1, orderBy: { createdAt: DescNullsLast }) {
              edges { node { createdAt outcome } }
            }
          }
        }
      }
    }
  `, {
    filter: {
      and: [
        { status: { eq: 'AVAILABLE' } },
        {
          or: [
            { designer: { ilike: `%${query}%` } },
            { color: { ilike: `%${query}%` } },
            { itemId: { ilike: `%${query}%` } },
          ],
        },
      ],
    },
  })
  return data.inventoryItems.edges.map(e => {
    const latest = e.node.pullItemLoans.edges[0]?.node ?? null
    return {
      id: e.node.id,
      designer: e.node.designer,
      color: e.node.color,
      itemType: e.node.itemType,
      status: e.node.status,
      lastRentedAt: latest?.createdAt ?? null,
      lastOutcome: latest?.outcome ?? null,
    }
  })
}

export async function createPullItemLoan(
  pullId: string,
  inventoryItemId: string,
  itemIdentifier: string,
  conditionNotes?: string,
  fileIds: string[] = [],
): Promise<{ id: string }> {
  const data = await gql<{ createPullItemLoan: { id: string } }>(`
    mutation CreatePullItemLoan($input: PullItemLoanCreateInput!) {
      createPullItemLoan(data: $input) { id }
    }
  `, {
    input: {
      name: itemIdentifier,
      pullId,
      inventoryItemId,
      ...(conditionNotes ? { conditionNotes } : {}),
      photos: fileIds.map(fileId => ({ fileId, label: 'Photo' })),
    },
  })
  return data.createPullItemLoan
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

export async function attachFilesToContact(contactId: string, fileIds: string[], namePrefix = 'photo'): Promise<void> {
  for (const fileId of fileIds) {
    await gql(`
      mutation AttachFile($input: AttachmentCreateInput!) {
        createAttachment(data: $input) { id }
      }
    `, {
      input: {
        targetPersonId: contactId,
        name: `${namePrefix}-${fileId.slice(0, 8)}`,
        file: [{ fileId, label: 'Photo' }],
      },
    })
  }
}

const LICENSE_ATTACHMENT_PREFIX = 'license'

export interface LicensePhoto {
  attachmentId: string
  url: string
}

export async function getLicensePhotosForContact(contactId: string): Promise<LicensePhoto[]> {
  const data = await gql<{ person: { attachments: { edges: { node: {
    id: string
    name: string
    createdAt: string
    file: { url: string }[]
  } }[] } } | null }>(`
    query LicensePhotos($id: ID!) {
      person(filter: { id: { eq: $id } }) {
        attachments {
          edges { node { id name createdAt file } }
        }
      }
    }
  `, { id: contactId })
  const attachments = data.person?.attachments.edges.map(e => e.node) ?? []
  return attachments
    .filter(a => a.name.startsWith(`${LICENSE_ATTACHMENT_PREFIX}-`) && a.file[0]?.url)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(a => ({ attachmentId: a.id, url: a.file[0].url }))
}
