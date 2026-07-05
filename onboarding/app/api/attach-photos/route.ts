import { NextRequest, NextResponse } from 'next/server'
import { attachFilesToPull, attachFilesToContact } from '@/lib/twenty'

export async function POST(req: NextRequest) {
  try {
    const { contactId, pullId, fileIds } = await req.json()
    if (!contactId || !Array.isArray(fileIds)) {
      return NextResponse.json({ error: 'contactId and fileIds required' }, { status: 400 })
    }
    if (fileIds.length === 0) return NextResponse.json({ pullId: pullId ?? null, attached: true })

    if (pullId) {
      await attachFilesToPull(pullId, fileIds)
      return NextResponse.json({ pullId, attached: true })
    }

    await attachFilesToContact(contactId, fileIds)
    return NextResponse.json({ pullId: null, attached: true })
  } catch (err) {
    console.error('[api/attach-photos]', err)
    const message = err instanceof Error ? err.message : 'Failed to attach photos'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
