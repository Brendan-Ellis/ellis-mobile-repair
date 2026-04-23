import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from './session'

export const verifyAdmin = cache(async () => {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
})
