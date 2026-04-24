'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import { notifyAdminNewBooking, sendQuoteEmail, sendSms, notifyAdminQuoteResponse } from '@/lib/notify'
import { randomBytes } from 'crypto'

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

  const booking = await prisma.booking.create({
    data: { name, email, phone, address, city, equipmentType, equipmentMake, equipmentYear, services, issues, preferredDate },
  })

  await notifyAdminNewBooking(booking)

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

export async function sendQuote(bookingId: string, amount: number, message: string) {
  await verifyAdmin()
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
  const token = randomBytes(32).toString('hex')

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      quoteToken: token,
      quoteAmount: amount,
      quoteMessage: message || null,
      quoteSentAt: new Date(),
      quoteResponse: null,
      quoteRespondedAt: null,
      status: 'quote_sent',
    },
  })

  await sendQuoteEmail({
    name: booking.name,
    email: booking.email,
    services: booking.services,
    preferredDate: booking.preferredDate,
    quoteAmount: amount,
    quoteMessage: message,
    quoteToken: token,
  })

  const smsBody = `Hi ${booking.name}, Ellis Mobile Repair sent you a quote for $${amount.toFixed(2)}. View and respond: ${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.ellismobilerepair.com'}/quote/${token}`
  await sendSms(booking.phone, smsBody)

  revalidatePath('/admin')
}

export async function respondToQuote(token: string, response: 'accepted' | 'declined') {
  const booking = await prisma.booking.findUnique({ where: { quoteToken: token } })
  if (!booking) return { error: 'Quote not found.' }
  if (booking.quoteResponse) return { error: 'You already responded to this quote.' }

  await prisma.booking.update({
    where: { quoteToken: token },
    data: {
      quoteResponse: response,
      quoteRespondedAt: new Date(),
      status: response === 'accepted' ? 'accepted' : 'declined',
    },
  })

  await notifyAdminQuoteResponse({
    name: booking.name,
    phone: booking.phone,
    email: booking.email,
    services: booking.services,
    quoteAmount: Number(booking.quoteAmount ?? 0),
    quoteResponse: response,
  })

  if (response === 'accepted') {
    const smsBody = `${booking.name} accepted the quote for $${booking.quoteAmount?.toFixed(2)}. Call to confirm: ${booking.phone}`
    await sendSms(process.env.ADMIN_PHONE ?? '', smsBody)
  }

  return { success: true, response }
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
