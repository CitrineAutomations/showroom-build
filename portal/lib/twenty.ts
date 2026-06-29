const TWENTY_API_URL = process.env.TWENTY_API_URL
const TWENTY_API_KEY = process.env.TWENTY_API_KEY

if (!TWENTY_API_URL || !TWENTY_API_KEY) {
  throw new Error('TWENTY_API_URL and TWENTY_API_KEY must be set in .env.local')
}

export async function fetchTwenty<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${TWENTY_API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TWENTY_API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Twenty API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()

  if (json.errors?.length) {
    throw new Error(`Twenty GraphQL error: ${json.errors[0].message}`)
  }

  return json.data as T
}

export { TWENTY_API_URL, TWENTY_API_KEY }
