import { NextRequest, NextResponse } from 'next/server'
import { updatePersonDriversLicense, getLicensePhotosForContact } from '@/lib/twenty'

export async function GET(req: NextRequest) {
  try {
    const contactId = req.nextUrl.searchParams.get('contactId')
    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }
    const photos = await getLicensePhotosForContact(contactId)
    return NextResponse.json({ photos })
  } catch (err) {
    console.error('[api/contact/license]', err)
    const message = err instanceof Error ? err.message : 'Failed to look up license photos'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { contactId, fileIds } = await req.json()
    if (!contactId || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'contactId and at least one fileId are required' }, { status: 400 })
    }
    await updatePersonDriversLicense(contactId, fileIds)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/contact/license]', err)
    const message = err instanceof Error ? err.message : 'Failed to attach license photos'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
