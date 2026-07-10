import { currentUser } from '@clerk/nextjs/server'
import { findContactIdByEmail } from './twenty'

export async function getCurrentContactId(): Promise<string | null> {
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress
  if (!email) return null
  return findContactIdByEmail(email)
}
