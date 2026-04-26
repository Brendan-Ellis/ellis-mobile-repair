import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-square-hmacsha256-signature') ?? ''
  const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET

  // Verify signature if secret is set
  if (webhookSecret) {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.ellismobilerepair.com'}/api/square-webhook`
    const hmac = crypto.createHmac('sha256', webhookSecret).update(url + body).digest('base64')
    if (hmac !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let event: { type: string; data?: { object?: { payment?: { id: string; status: string; amount_money?: { amount: number }; note?: string; order_id?: string } } } }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.type === 'payment.updated') {
    const payment = event.data?.object?.payment
    if (!payment || payment.status !== 'COMPLETED') return NextResponse.json({ ok: true })

    const amountDollars = (payment.amount_money?.amount ?? 0) / 100
    const note = payment.note ?? ''

    // Try to match booking by amount + recent quote_sent/accepted status
    // Square POS payments include the note we set: "CustomerName — EquipmentType"
    const namePart = note.split('—')[0]?.trim()

    let booking = null

    if (namePart) {
      booking = await prisma.booking.findFirst({
        where: {
          name: { contains: namePart, mode: 'insensitive' },
          isPaid: false,
          OR: [{ status: 'accepted' }, { status: 'in_progress' }, { status: 'quote_sent' }],
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    // Fallback: match by amount
    if (!booking) {
      booking = await prisma.booking.findFirst({
        where: {
          isPaid: false,
          OR: [
            { grandTotal: amountDollars },
            { quoteAmount: amountDollars },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentMethod: 'card',
          status: 'completed',
        },
      })
      revalidatePath('/admin/jobs')
      revalidatePath('/admin/revenue')
    }
  }

  return NextResponse.json({ ok: true })
}
