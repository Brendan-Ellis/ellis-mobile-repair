'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'

export async function login(prevState: { error?: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Email and password are required.' }

  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!admin) return { error: 'Invalid email or password.' }

  const valid = await bcrypt.compare(password, admin.password)
  if (!valid) return { error: 'Invalid email or password.' }

  await createSession({ adminId: admin.id, email: admin.email })
  redirect('/admin')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
