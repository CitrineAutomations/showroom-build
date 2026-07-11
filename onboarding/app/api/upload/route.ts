import { NextRequest, NextResponse } from 'next/server'
import { uploadFileToTwenty } from '@/lib/twenty'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 413 })

    const arrayBuffer = await file.arrayBuffer()
    const fileId = await uploadFileToTwenty(arrayBuffer, file.name, file.type)
    return NextResponse.json({ fileId, fileName: file.name })
  } catch (err) {
    console.error('[api/upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
