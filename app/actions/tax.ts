'use server'

import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

export async function markTaxPaid(quarter: string, type: string, owed: number, paidAmount: number, notes: string) {
  await verifyAdmin()
  const existing = await prisma.taxPayment.findFirst({ where: { quarter, type } })
  if (existing) {
    await prisma.taxPayment.update({
      where: { id: existing.id },
      data: { paidAt: new Date(), paidAmount, notes: notes || null },
    })
  } else {
    await prisma.taxPayment.create({
      data: {
        id: randomBytes(12).toString('hex'),
        quarter, type, owed, paidAt: new Date(), paidAmount, notes: notes || null,
      },
    })
  }
  revalidatePath('/admin/revenue')
}

export async function unmarkTaxPaid(quarter: string, type: string) {
  await verifyAdmin()
  await prisma.taxPayment.updateMany({
    where: { quarter, type },
    data: { paidAt: null, paidAmount: null },
  })
  revalidatePath('/admin/revenue')
}
