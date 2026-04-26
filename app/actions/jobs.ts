'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import { sendQuoteEmail, sendReceiptEmail, sendPaymentRequestEmail, sendSms } from '@/lib/notify'
import { getTaxRate } from '@/lib/tax'
import { randomBytes } from 'crypto'

export interface LineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
  total: number
}

function cuid() { return randomBytes(12).toString('hex') }

export async function createManualJob(formData: FormData) {
  await verifyAdmin()
  const customerId = formData.get('customerId') as string | null
  const name = formData.get('name') as string
  const phone = (formData.get('phone') as string) || ''
  const email = (formData.get('email') as string) || ''
  const address = (formData.get('address') as string) || ''
  const city = (formData.get('city') as string) || ''
  const equipmentType = (formData.get('equipmentType') as string) || 'Unknown'
  const equipmentMake = (formData.get('equipmentMake') as string) || ''
  const issues = (formData.get('issues') as string) || ''
  const preferredDate = (formData.get('preferredDate') as string) || new Date().toISOString().split('T')[0]

  // Auto-match or create customer
  let customer = customerId ? await prisma.customer.findUnique({ where: { id: customerId } }) : null
  if (!customer && (phone || email)) {
    customer = await prisma.customer.findFirst({ where: { OR: [phone ? { phone } : undefined, email ? { email } : undefined].filter(Boolean) as any } })
  }
  if (!customer) {
    customer = await prisma.customer.create({
      data: { id: cuid(), name, email: email || null, phone: phone || null, address: address || null, city: city || null },
    })
  }

  await prisma.booking.create({
    data: {
      id: cuid(),
      name, phone, email, address, city,
      equipmentType, equipmentMake: equipmentMake || null,
      services: [], issues: issues || 'Manual job', preferredDate,
      status: 'accepted',
      isManual: true,
      customerId: customer.id,
    },
  })
  revalidatePath('/admin/jobs')
}

export async function saveQuoteLineItems(
  bookingId: string,
  lineItems: LineItem[],
  discountAmount: number | null,
  discountNote: string,
  taxRateOverride: number | null,
  quoteNotes: string,
) {
  await verifyAdmin()
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
  const subtotal = lineItems.reduce((s, i) => s + i.total, 0)
  const discount = discountAmount ?? 0
  const taxRate = taxRateOverride ?? getTaxRate(booking.city)
  const taxable = subtotal - discount
  const taxAmount = Math.round(taxable * (taxRate / 100) * 100) / 100
  const grandTotal = taxable + taxAmount

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      lineItems: lineItems as any,
      subtotal, discountAmount: discount || null, discountNote: discountNote || null,
      taxRate, taxAmount, grandTotal,
      quoteNotes: quoteNotes || null,
    },
  })
  revalidatePath('/admin/jobs')
}

export async function sendLineItemQuote(bookingId: string) {
  await verifyAdmin()
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
  if (!booking.grandTotal) throw new Error('Build the quote first.')

  const token = randomBytes(32).toString('hex')
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      quoteToken: token,
      quoteAmount: booking.grandTotal,
      quoteSentAt: new Date(),
      quoteResponse: null,
      quoteRespondedAt: null,
      quoteViewedAt: null,
      status: 'quote_sent',
    },
  })

  await sendQuoteEmail({
    name: booking.name,
    email: booking.email,
    services: booking.services,
    preferredDate: booking.preferredDate,
    quoteAmount: booking.grandTotal,
    quoteMessage: booking.quoteNotes ?? '',
    quoteToken: token,
    lineItems: booking.lineItems as LineItem[] | null,
    subtotal: booking.subtotal,
    discountAmount: booking.discountAmount,
    discountNote: booking.discountNote,
    taxRate: booking.taxRate,
    taxAmount: booking.taxAmount,
    grandTotal: booking.grandTotal,
  })

  const smsBody = `Hi ${booking.name}, Ellis Mobile Repair sent you a quote for $${booking.grandTotal.toFixed(2)}. View: ${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.ellismobilerepair.com'}/quote/${token}`
  sendSms(booking.phone, smsBody).catch(() => {})

  revalidatePath('/admin/jobs')
}

export async function sendReceipt(bookingId: string) {
  await verifyAdmin()
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
  if (!booking.isPaid) throw new Error('Job must be marked paid first.')

  const token = booking.receiptToken ?? randomBytes(32).toString('hex')
  await prisma.booking.update({
    where: { id: bookingId },
    data: { receiptToken: token, receiptSentAt: new Date() },
  })

  if (booking.email) {
    await sendReceiptEmail({
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      equipmentType: booking.equipmentType,
      equipmentMake: booking.equipmentMake,
      services: booking.services,
      grandTotal: booking.grandTotal,
      quoteAmount: booking.quoteAmount,
      paidAt: booking.paidAt,
      paymentMethod: booking.paymentMethod,
      receiptToken: token,
    })
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.ellismobilerepair.com'
  const smsBody = `Hi ${booking.name}, here's your receipt from Ellis Mobile Repair: ${BASE_URL}/receipt/${token}`
  sendSms(booking.phone, smsBody).catch(() => {})

  revalidatePath('/admin/jobs')
  return token
}

export async function markJobPaid(bookingId: string, paymentMethod: string) {
  await verifyAdmin()
  await prisma.booking.update({
    where: { id: bookingId },
    data: { isPaid: true, paidAt: new Date(), paymentMethod, status: 'completed' },
  })
  revalidatePath('/admin/jobs')
}

export async function markJobUnpaid(bookingId: string) {
  await verifyAdmin()
  await prisma.booking.update({
    where: { id: bookingId },
    data: { isPaid: false, paidAt: null, paymentMethod: null },
  })
  revalidatePath('/admin/jobs')
}

export async function saveJobExpenses(bookingId: string, expenseCost: number | null, expenseNotes: string) {
  await verifyAdmin()
  await prisma.booking.update({
    where: { id: bookingId },
    data: { expenseCost: expenseCost ?? null, expenseNotes: expenseNotes || null },
  })
  revalidatePath('/admin/jobs')
}

export async function sendPaymentRequest(bookingId: string): Promise<string> {
  await verifyAdmin()
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
  const amount = booking.grandTotal ?? booking.quoteAmount
  if (!amount) throw new Error('No quote amount set.')

  const amountCents = Math.round(amount * 100)
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.ellismobilerepair.com'

  const res = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
    },
    body: JSON.stringify({
      idempotency_key: `pay-${bookingId}-${Date.now()}`,
      quick_pay: {
        name: `Ellis Mobile Repair — ${booking.equipmentType}${booking.equipmentMake ? ` (${booking.equipmentMake})` : ''}`,
        price_money: { amount: amountCents, currency: 'USD' },
        location_id: process.env.SQUARE_LOCATION_ID,
      },
      checkout_options: {
        redirect_url: `${BASE_URL}/quote/${booking.quoteToken ?? ''}?paid=1`,
        ask_for_shipping_address: false,
      },
      pre_populated_data: { buyer_email: booking.email || undefined },
    }),
  })

  const data = await res.json()
  const paymentUrl = data.payment_link?.url ?? ''

  if (paymentUrl) {
    await prisma.booking.update({ where: { id: bookingId }, data: { squarePaymentUrl: paymentUrl } })
  }

  if (booking.email && paymentUrl) {
    await sendPaymentRequestEmail({
      name: booking.name,
      email: booking.email,
      equipmentType: booking.equipmentType,
      equipmentMake: booking.equipmentMake,
      grandTotal: booking.grandTotal,
      quoteAmount: booking.quoteAmount,
      paymentUrl,
    })
  }

  const smsBody = `Hi ${booking.name}, your ${booking.equipmentType} service is complete! Pay online: ${paymentUrl}`
  sendSms(booking.phone, smsBody).catch(() => {})

  revalidatePath('/admin/jobs')
  return paymentUrl
}

export async function updateJobStatus(bookingId: string, status: string) {
  await verifyAdmin()
  await prisma.booking.update({ where: { id: bookingId }, data: { status } })

  if (status === 'completed') {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (booking && !booking.isPaid && (booking.grandTotal ?? booking.quoteAmount)) {
      sendPaymentRequest(bookingId).catch(() => {})
    }
  }

  revalidatePath('/admin/jobs')
}
