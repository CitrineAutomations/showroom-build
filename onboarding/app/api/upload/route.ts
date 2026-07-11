import { NextRequest, NextResponse } from 'next/server'
import { uploadFileToTwenty } from '@/lib/twenty'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const UPLOAD_TARGETS: Record<string, { objectName: string; fieldName: string }> = {
  itemImages: { objectName: 'inventoryItem', fieldName: 'itemImages' },
  pullItemLoanPhotos: { objectName: 'pullItemLoan', fieldName: 'photos' },
  driversLicense: { objectName: 'person', fieldName: 'driversLicense' },
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 413 })

    const targetKey = formData.get('target') as string | null
    const target = targetKey ? UPLOAD_TARGETS[targetKey] : undefined
    if (targetKey && !target) return NextResponse.json({ error: 'Unknown upload target' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const fileId = await uploadFileToTwenty(arrayBuffer, file.name, file.type, target)
    return NextResponse.json({ fileId, fileName: file.name })
  } catch (err) {
    console.error('[api/upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
