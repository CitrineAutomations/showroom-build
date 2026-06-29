import { NextRequest, NextResponse } from 'next/server'
import { TWENTY_API_URL, TWENTY_API_KEY } from '@/lib/twenty'

// Get a fresh signed URL by querying inventoryItems for this fileId
async function getFreshSignedUrl(fileId: string): Promise<string | null> {
  const res = await fetch(`${TWENTY_API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TWENTY_API_KEY}`,
    },
    body: JSON.stringify({
      query: `{
        inventoryItems(first: 100) {
          edges {
            node {
              photo { fileId url }
            }
          }
        }
      }`,
    }),
    cache: 'no-store',
  })

  if (!res.ok) return null

  const json = await res.json()
  const edges = json?.data?.inventoryItems?.edges ?? []

  for (const { node } of edges) {
    for (const photo of node.photo ?? []) {
      if (photo.fileId === fileId) return photo.url as string
    }
  }

  return null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params

  const signedUrl = await getFreshSignedUrl(fileId)

  if (!signedUrl) {
    return new NextResponse('Image not found', { status: 404 })
  }

  const imgRes = await fetch(signedUrl, { cache: 'no-store' })

  if (!imgRes.ok) {
    return new NextResponse('Image fetch failed', { status: 502 })
  }

  const contentType = imgRes.headers.get('content-type') ?? 'image/png'
  const buffer = await imgRes.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
