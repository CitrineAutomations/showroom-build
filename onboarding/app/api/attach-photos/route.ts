import { NextRequest, NextResponse } from 'next/server'
import { getActivePullForContact, attachFilesToPull, attachFilesToContact } from '@/lib/twenty'

export async function POST(req: NextRequest) {
  try {
    const { contactId, fileIds } = await req.json()
    if (!contactId || !Array.isArray(fileIds)) {
      return NextResponse.json({ error: 'contactId and fileIds required' }, { status: 400 })
    }
    if (fileIds.length === 0) return NextResponse.json({ pullId: null, attached: true })

    const pull = await getActivePullForContact(contactId)
    if (pull) {
      await attachFilesToPull(pull.id, fileIds)
      return NextResponse.json({ pullId: pull.id, attached: true })
    }

    await attachFilesToContact(contactId, fileIds)
    return NextResponse.json({ pullId: null, attached: true })
  } catch (err) {
    console.error('[api/attach-photos]', err)
    return NextResponse.json({ error: 'Failed to attach photos' }, { status: 500 })
  }
}
