'use server'

import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import { revalidatePath } from 'next/cache'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.ellismobilerepair.com'

async function buildPaymentLink(booking: { id: string; grandTotal: number | null; quoteAmount: number | null; equipmentType: string; equipmentMake: string | null; email: string; quoteToken: string | null }) {
  const amount = booking.grandTotal ?? booking.quoteAmount
  if (!amount) throw new Error('No quote amount set.')
  const amountCents = Math.round(amount * 100)

  const res = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
    },
    body: JSON.stringify({
      idempotency_key: `${booking.id}-${Date.now()}`,
      quick_pay: {
        name: `Ellis Mobile Repair — ${booking.equipmentType}${booking.equipmentMake ? ` (${booking.equipmentMake})` : ''}`,
        price_money: { amount: amountCents, currency: 'USD' },
        location_id: process.env.SQUARE_LOCATION_ID,
      },
      checkout_options: {
        redirect_url: `${BASE_URL}/quote/${booking.quoteToken}?paid=1`,
        ask_for_shipping_address: false,
      },
      pre_populated_data: { buyer_email: booking.email || undefined },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Square error:', err)
    throw new Error('Failed to create payment link.')
  }

  const data = await res.json()
  const url = data.payment_link?.url
  if (!url) throw new Error('No payment link returned.')
  return url
}

export async function createSquarePaymentLink(bookingId: string) {
  await verifyAdmin()
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
  const url = await buildPaymentLink(booking)
  await prisma.booking.update({ where: { id: bookingId }, data: { squarePaymentUrl: url } })
  revalidatePath('/admin/jobs')
  return url
}

export async function getOrCreateSquarePaymentLinkByToken(token: string) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { quoteToken: token } })
  if (booking.squarePaymentUrl) return booking.squarePaymentUrl
  const url = await buildPaymentLink(booking)
  await prisma.booking.update({ where: { id: booking.id }, data: { squarePaymentUrl: url } })
  return url
}
