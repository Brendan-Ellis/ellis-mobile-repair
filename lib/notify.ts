import { Resend } from 'resend'
import type { LineItem } from '@/app/actions/jobs'
import { DISCLAIMER } from '@/lib/tax'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'bellis@ellismobilerepair.com'
const FROM = 'Ellis Mobile Repair <noreply@ellismobilerepair.com>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.ellismobilerepair.com'

export async function notifyAdminNewBooking(booking: {
  name: string
  email: string
  phone: string
  city: string
  equipmentType: string
  services: string[]
  issues: string
  preferredDate: string
}) {
  if (!process.env.RESEND_API_KEY) return
  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Booking Request — ${booking.name}`,
    html: `
      <h2>New Booking Request</h2>
      <p><strong>Name:</strong> ${booking.name}</p>
      <p><strong>Phone:</strong> ${booking.phone}</p>
      <p><strong>Email:</strong> ${booking.email}</p>
      <p><strong>City:</strong> ${booking.city}</p>
      <p><strong>Equipment:</strong> ${booking.equipmentType}</p>
      <p><strong>Services:</strong> ${booking.services.join(', ')}</p>
      <p><strong>Issue:</strong> ${booking.issues}</p>
      <p><strong>Preferred Date:</strong> ${booking.preferredDate}</p>
      <p><a href="${BASE_URL}/admin" style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px;">View in Admin</a></p>
    `,
  }).catch(() => {})
}

export async function sendQuoteEmail(booking: {
  name: string
  email: string
  services: string[]
  preferredDate: string
  quoteAmount: number
  quoteMessage: string
  quoteToken: string
  lineItems?: LineItem[] | null
  subtotal?: number | null
  discountAmount?: number | null
  discountNote?: string | null
  taxRate?: number | null
  taxAmount?: number | null
  grandTotal?: number | null
}) {
  if (!process.env.RESEND_API_KEY) return
  const viewUrl = `${BASE_URL}/quote/${booking.quoteToken}`
  const acceptUrl = `${BASE_URL}/quote/${booking.quoteToken}?response=accepted`
  const declineUrl = `${BASE_URL}/quote/${booking.quoteToken}?response=declined`

  const hasLineItems = booking.lineItems && booking.lineItems.length > 0

  const lineItemsHtml = hasLineItems ? `
    <table style="border-collapse:collapse;width:100%;max-width:560px;margin:16px 0;font-size:0.9rem;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 10px;text-align:left;color:#374151;font-weight:600;">Description</th>
          <th style="padding:8px 10px;text-align:center;color:#374151;font-weight:600;">Qty</th>
          <th style="padding:8px 10px;text-align:right;color:#374151;font-weight:600;">Unit</th>
          <th style="padding:8px 10px;text-align:right;color:#374151;font-weight:600;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${booking.lineItems!.map((item, i) => `
        <tr style="${i % 2 === 1 ? 'background:#f9fafb;' : ''}">
          <td style="padding:8px 10px;color:#111827;">${item.description}</td>
          <td style="padding:8px 10px;text-align:center;color:#374151;">${item.qty}</td>
          <td style="padding:8px 10px;text-align:right;color:#374151;">$${item.unitPrice.toFixed(2)}</td>
          <td style="padding:8px 10px;text-align:right;font-weight:600;color:#111827;">$${item.total.toFixed(2)}</td>
        </tr>`).join('')}
      </tbody>
      <tfoot>
        <tr style="border-top:1px solid #e5e7eb;">
          <td colspan="3" style="padding:6px 10px;text-align:right;color:#6b7280;">Subtotal</td>
          <td style="padding:6px 10px;text-align:right;">$${(booking.subtotal ?? 0).toFixed(2)}</td>
        </tr>
        ${booking.discountAmount ? `
        <tr>
          <td colspan="3" style="padding:6px 10px;text-align:right;color:#6b7280;">Discount${booking.discountNote ? ` (${booking.discountNote})` : ''}</td>
          <td style="padding:6px 10px;text-align:right;color:#dc2626;">-$${booking.discountAmount.toFixed(2)}</td>
        </tr>` : ''}
        ${(booking.taxRate ?? 0) > 0 ? `
        <tr>
          <td colspan="3" style="padding:6px 10px;text-align:right;color:#6b7280;">Tax (${booking.taxRate}%)</td>
          <td style="padding:6px 10px;text-align:right;">$${(booking.taxAmount ?? 0).toFixed(2)}</td>
        </tr>` : ''}
        <tr style="border-top:2px solid #e5e7eb;background:#f0fdf4;">
          <td colspan="3" style="padding:10px;text-align:right;font-weight:700;color:#111827;">Total Due</td>
          <td style="padding:10px;text-align:right;font-size:1.2rem;font-weight:700;color:#16a34a;">$${(booking.grandTotal ?? booking.quoteAmount).toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  ` : `
    <table style="border-collapse:collapse;width:100%;max-width:500px;margin:16px 0;">
      <tr><td style="padding:8px;color:#6b7280;">Services</td><td style="padding:8px;font-weight:600;">${booking.services.join(', ')}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Preferred Date</td><td style="padding:8px;">${booking.preferredDate}</td></tr>
      <tr><td style="padding:8px;color:#6b7280;">Estimated Total</td><td style="padding:8px;font-size:1.25rem;font-weight:700;color:#16a34a;">$${booking.quoteAmount.toFixed(2)}</td></tr>
    </table>
  `

  await getResend().emails.send({
    from: FROM,
    to: booking.email,
    subject: `Your Service Quote — Ellis Mobile Repair`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#111827;">Hi ${booking.name},</h2>
      <p style="color:#374151;">Thanks for requesting service! Here's your quote from Ellis Mobile Repair:</p>
      ${lineItemsHtml}
      ${booking.quoteMessage ? `<p style="background:#f3f4f6;padding:12px;border-radius:8px;color:#374151;margin:16px 0;">${booking.quoteMessage}</p>` : ''}
      <div style="margin-top:24px;">
        <a href="${viewUrl}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;margin-right:8px;margin-bottom:8px;">View Full Quote</a>
        <a href="${acceptUrl}" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;margin-right:8px;margin-bottom:8px;">Accept Quote</a>
        <a href="${declineUrl}" style="background:#fff;color:#374151;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;border:1px solid #d1d5db;display:inline-block;margin-bottom:8px;">Decline</a>
      </div>
      <p style="margin-top:24px;color:#9ca3af;font-size:0.8rem;">${DISCLAIMER}</p>
      <p style="color:#9ca3af;font-size:0.8rem;">Questions? Call us at <a href="tel:+17123265651" style="color:#16a34a;">(712) 326-5651</a></p>
      </div>
    `,
  }).catch(() => {})
}

export async function notifyAdminQuoteResponse(booking: {
  name: string
  phone: string
  email: string
  services: string[]
  quoteAmount: number
  quoteResponse: string
}) {
  if (!process.env.RESEND_API_KEY) return
  const accepted = booking.quoteResponse === 'accepted'
  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Quote ${accepted ? 'Accepted ✅' : 'Declined ❌'} — ${booking.name}`,
    html: `
      <h2>Quote ${accepted ? 'Accepted' : 'Declined'}</h2>
      <p><strong>${booking.name}</strong> has ${accepted ? 'accepted' : 'declined'} the quote.</p>
      <p><strong>Phone:</strong> ${booking.phone}</p>
      <p><strong>Email:</strong> ${booking.email}</p>
      <p><strong>Services:</strong> ${booking.services.join(', ')}</p>
      <p><strong>Quote Amount:</strong> $${booking.quoteAmount.toFixed(2)}</p>
      ${accepted ? `<p style="color:#16a34a;font-weight:600;">Give them a call to confirm the appointment!</p>` : `<p style="color:#6b7280;">You may want to follow up to see if they have any questions.</p>`}
      <p><a href="${BASE_URL}/admin" style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px;">View in Admin</a></p>
    `,
  }).catch(() => {})
}

export async function sendPaymentRequestEmail(booking: {
  name: string
  email: string
  equipmentType: string
  equipmentMake: string | null
  grandTotal: number | null
  quoteAmount: number | null
  paymentUrl: string
}) {
  if (!process.env.RESEND_API_KEY) return
  const total = booking.grandTotal ?? booking.quoteAmount ?? 0
  await getResend().emails.send({
    from: FROM,
    to: booking.email,
    subject: `Payment Request — Ellis Mobile Repair`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#111827;">Hi ${booking.name},</h2>
        <p style="color:#374151;">Your ${booking.equipmentType}${booking.equipmentMake ? ` (${booking.equipmentMake})` : ''} service is complete! Please use the button below to pay securely online.</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
          <p style="color:#6b7280;margin:0 0 8px;">Amount Due</p>
          <p style="font-size:2rem;font-weight:700;color:#16a34a;margin:0;">$${total.toFixed(2)}</p>
        </div>
        <a href="${booking.paymentUrl}" style="background:#16a34a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;font-size:1rem;">Pay Now — $${total.toFixed(2)}</a>
        <p style="margin-top:20px;color:#9ca3af;font-size:0.8rem;">You can pay securely by card. Questions? Call <a href="tel:+17123265651" style="color:#16a34a;">(712) 326-5651</a></p>
      </div>
    `,
  }).catch(() => {})
}

export async function sendReceiptEmail(booking: {
  name: string
  email: string
  phone: string
  equipmentType: string
  equipmentMake: string | null
  services: string[]
  grandTotal: number | null
  quoteAmount: number | null
  paidAt: Date | null
  paymentMethod: string | null
  receiptToken: string
}) {
  if (!process.env.RESEND_API_KEY) return
  const receiptUrl = `${BASE_URL}/receipt/${booking.receiptToken}`
  const total = booking.grandTotal ?? booking.quoteAmount ?? 0
  await getResend().emails.send({
    from: FROM,
    to: booking.email,
    subject: `Your Receipt — Ellis Mobile Repair`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#111827;">Hi ${booking.name},</h2>
        <p style="color:#374151;">Thanks for your business! Here's your receipt from Ellis Mobile Repair.</p>
        <table style="border-collapse:collapse;width:100%;max-width:500px;margin:16px 0;">
          <tr><td style="padding:8px;color:#6b7280;">Equipment</td><td style="padding:8px;font-weight:600;">${booking.equipmentType}${booking.equipmentMake ? ` — ${booking.equipmentMake}` : ''}</td></tr>
          ${booking.services.length > 0 ? `<tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Services</td><td style="padding:8px;">${booking.services.join(', ')}</td></tr>` : ''}
          <tr><td style="padding:8px;color:#6b7280;">Date Paid</td><td style="padding:8px;">${booking.paidAt ? new Date(booking.paidAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Today'}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Payment Method</td><td style="padding:8px;text-transform:capitalize;">${booking.paymentMethod ?? '—'}</td></tr>
          <tr style="background:#f0fdf4;"><td style="padding:10px 8px;color:#111827;font-weight:700;">Total Paid</td><td style="padding:10px 8px;font-size:1.25rem;font-weight:700;color:#16a34a;">$${total.toFixed(2)}</td></tr>
        </table>
        <a href="${receiptUrl}" style="background:#111827;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;margin-top:8px;">View Full Receipt</a>
        <p style="margin-top:16px;color:#9ca3af;font-size:0.8rem;">You can print or save your receipt as a PDF from the link above.</p>
        <p style="color:#9ca3af;font-size:0.8rem;">Questions? Call us at <a href="tel:+17123265651" style="color:#16a34a;">(712) 326-5651</a></p>
      </div>
    `,
  }).catch(() => {})
}

export async function sendSms(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE) {
    console.log('SMS skipped: missing Twilio env vars')
    return
  }
  if (!to) {
    console.log('SMS skipped: no recipient number')
    return
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`
  const creds = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: process.env.TWILIO_PHONE, Body: body }).toString(),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('Twilio error:', err)
  }
}
