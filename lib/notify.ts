import { Resend } from 'resend'

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
}) {
  if (!process.env.RESEND_API_KEY) return
  const acceptUrl = `${BASE_URL}/quote/${booking.quoteToken}?response=accepted`
  const declineUrl = `${BASE_URL}/quote/${booking.quoteToken}?response=declined`
  await getResend().emails.send({
    from: FROM,
    to: booking.email,
    subject: `Your Service Quote — Ellis Mobile Repair`,
    html: `
      <h2>Hi ${booking.name},</h2>
      <p>Thanks for requesting service! Here's your quote:</p>
      <table style="border-collapse:collapse;width:100%;max-width:500px;margin:16px 0;">
        <tr><td style="padding:8px;color:#6b7280;">Services</td><td style="padding:8px;font-weight:600;">${booking.services.join(', ')}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Preferred Date</td><td style="padding:8px;">${booking.preferredDate}</td></tr>
        <tr><td style="padding:8px;color:#6b7280;">Estimated Total</td><td style="padding:8px;font-size:1.25rem;font-weight:700;color:#16a34a;">$${booking.quoteAmount.toFixed(2)}</td></tr>
      </table>
      ${booking.quoteMessage ? `<p style="background:#f3f4f6;padding:12px;border-radius:8px;color:#374151;">${booking.quoteMessage}</p>` : ''}
      <p style="color:#6b7280;font-size:0.875rem;">Parts and materials may be additional. Final price confirmed before work begins.</p>
      <div style="margin-top:24px;display:flex;gap:12px;">
        <a href="${acceptUrl}" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;margin-right:12px;">Accept Quote</a>
        <a href="${declineUrl}" style="background:#fff;color:#374151;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;border:1px solid #d1d5db;display:inline-block;">Decline</a>
      </div>
      <p style="margin-top:24px;color:#9ca3af;font-size:0.8rem;">Questions? Call us at <a href="tel:+17123265651" style="color:#16a34a;">(712) 326-5651</a></p>
    `,
  }).catch(() => {})
}

export async function sendSms(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE) return
  const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`
  const creds = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: process.env.TWILIO_PHONE, Body: body }).toString(),
  }).catch(() => {})
}
