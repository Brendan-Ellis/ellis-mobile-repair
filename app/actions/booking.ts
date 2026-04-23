'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'

export async function submitBooking(prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const equipmentType = formData.get('equipmentType') as string
  const equipmentMake = formData.get('equipmentMake') as string
  const equipmentYear = formData.get('equipmentYear') as string
  const issues = formData.get('issues') as string
  const preferredDate = formData.get('preferredDate') as string
  const services = formData.getAll('services') as string[]

  if (!name || !email || !phone || !address || !city || !equipmentType || !issues || !preferredDate) {
    return { error: 'Please fill in all required fields.' }
  }
  if (services.length === 0) {
    return { error: 'Please select at least one service.' }
  }

  await prisma.booking.create({
    data: { name, email, phone, address, city, equipmentType, equipmentMake, equipmentYear, services, issues, preferredDate },
  })

  return { success: true }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  await verifyAdmin()
  await prisma.booking.update({ where: { id: bookingId }, data: { status } })
  revalidatePath('/admin')
}

export async function updateBookingDetails(
  bookingId: string,
  adminNotes: string,
  partsUsed: string,
  laborHours: number | null,
  price: number | null,
) {
  await verifyAdmin()
  await prisma.booking.update({
    where: { id: bookingId },
    data: { adminNotes: adminNotes || null, partsUsed: partsUsed || null, laborHours, price },
  })
  revalidatePath('/admin')
}

export async function markInvoiceSent(bookingId: string) {
  await verifyAdmin()
  await prisma.booking.update({ where: { id: bookingId }, data: { invoiceSent: true } })
  revalidatePath('/admin')
}

export async function deleteBooking(bookingId: string) {
  await verifyAdmin()
  await prisma.booking.delete({ where: { id: bookingId } })
  revalidatePath('/admin')
}
