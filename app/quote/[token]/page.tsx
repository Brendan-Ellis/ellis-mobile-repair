import { prisma } from '@/lib/prisma'
import { respondToQuote, markQuoteViewed } from '@/app/actions/booking'
import { DISCLAIMER } from '@/lib/tax'
import type { LineItem } from '@/app/actions/jobs'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ response?: string; paid?: string }>
}) {
  const { token } = await params
  const { response, paid } = await searchParams

  const booking = await prisma.booking.findUnique({ where: { quoteToken: token } })

  if (!booking || !booking.quoteAmount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-2xl mb-3">🔍</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Quote Not Found</h1>
          <p className="text-gray-500 text-sm">This link may be invalid or expired.</p>
          <p className="text-sm text-gray-400 mt-4">Call us at <a href="tel:+17123265651" className="text-green-600 font-medium">(712) 326-5651</a></p>
        </div>
      </div>
    )
  }

  await markQuoteViewed(token)

  const quoteExpired = !booking.quoteResponse &&
    booking.quoteSentAt &&
    (Date.now() - new Date(booking.quoteSentAt).getTime()) / (1000 * 60 * 60 * 24) > 30

  if (quoteExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-4xl mb-4">⏰</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Quote Expired</h1>
          <p className="text-gray-500 text-sm mb-4">This quote was valid for 30 days and has expired. Please contact us for an updated quote.</p>
          <a href="tel:+17123265651" className="inline-block bg-green-600 text-white font-bold px-6 py-3 rounded-xl text-sm">Call (712) 326-5651</a>
        </div>
      </div>
    )
  }

  if (response === 'accepted' || response === 'declined') {
    if (!booking.quoteResponse) {
      await respondToQuote(token, response)
    }
    redirect(`/quote/${token}`)
  }

  const alreadyResponded = !!booking.quoteResponse
  const lineItems = booking.lineItems as LineItem[] | null
  const hasLineItems = lineItems && lineItems.length > 0

  async function accept() {
    'use server'
    await respondToQuote(token, 'accepted')
    redirect(`/quote/${token}`)
  }

  async function decline() {
    'use server'
    await respondToQuote(token, 'declined')
    redirect(`/quote/${token}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-gray-900">Ellis Mobile Repair</Link>
          <a href="tel:+17123265651" className="text-sm text-green-600 font-medium">(712) 326-5651</a>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        {alreadyResponded ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            {booking.quoteResponse === 'accepted' ? (
              <>
                <div className="text-5xl mb-4">{paid ? '🎉' : '✅'}</div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  {paid ? 'Payment Received!' : 'Quote Accepted!'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {paid
                    ? 'Thank you! Your payment has been processed.'
                    : "We'll be in touch shortly to confirm your appointment."}
                </p>
                <p className="text-sm text-gray-400 mt-4">Questions? Call <a href="tel:+17123265651" className="text-green-600 font-medium">(712) 326-5651</a></p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">❌</div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Quote Declined</h1>
                <p className="text-gray-500 text-sm">No problem — feel free to reach out if you have questions.</p>
                <p className="text-sm text-gray-400 mt-4">Call <a href="tel:+17123265651" className="text-green-600 font-medium">(712) 326-5651</a></p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Quote</h1>
              <p className="text-gray-500 text-sm mt-1">Review and respond to your service estimate below.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{booking.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{booking.preferredDate}</p>
                </div>
                <p className="text-xs text-gray-500 text-right">Ellis Mobile Repair</p>
              </div>

              {hasLineItems ? (
                <>
                  {/* Line items table */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-5 py-2 text-left text-gray-500 font-medium">Description</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-medium">Qty</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">Unit</th>
                        <th className="px-5 py-2 text-right text-gray-500 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, i) => (
                        <tr key={item.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}>
                          <td className="px-5 py-3 text-gray-900">{item.description}</td>
                          <td className="px-3 py-3 text-center text-gray-600">{item.qty}</td>
                          <td className="px-3 py-3 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                          <td className="px-5 py-3 text-right font-medium text-gray-900">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-gray-200">
                      <tr>
                        <td colSpan={3} className="px-5 py-2 text-right text-gray-500 text-xs">Subtotal</td>
                        <td className="px-5 py-2 text-right text-gray-700">${(booking.subtotal ?? 0).toFixed(2)}</td>
                      </tr>
                      {(booking.discountAmount ?? 0) > 0 && (
                        <tr>
                          <td colSpan={3} className="px-5 py-2 text-right text-gray-500 text-xs">
                            Discount{booking.discountNote ? ` — ${booking.discountNote}` : ''}
                          </td>
                          <td className="px-5 py-2 text-right text-red-600">-${booking.discountAmount!.toFixed(2)}</td>
                        </tr>
                      )}
                      {(booking.taxRate ?? 0) > 0 && (
                        <tr>
                          <td colSpan={3} className="px-5 py-2 text-right text-gray-500 text-xs">Tax ({booking.taxRate}%)</td>
                          <td className="px-5 py-2 text-right text-gray-700">${(booking.taxAmount ?? 0).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="bg-green-50 border-t-2 border-green-100">
                        <td colSpan={3} className="px-5 py-3 text-right font-bold text-gray-900">Total Due</td>
                        <td className="px-5 py-3 text-right text-2xl font-bold text-green-600">${(booking.grandTotal ?? booking.quoteAmount).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </>
              ) : (
                <div className="px-5 py-4 space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Services</span>
                    <span className="font-medium text-gray-900 text-sm text-right max-w-[60%]">{booking.services.join(', ')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Estimated Total</span>
                    <span className="text-2xl font-bold text-green-600">${booking.quoteAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {booking.quoteNotes && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Note from Ellis Mobile Repair</p>
                <p className="text-sm text-gray-700">{booking.quoteNotes}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 leading-relaxed">{DISCLAIMER}</p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <form action={accept} className="flex-1">
                <button type="submit" className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-base transition-colors">
                  Accept Quote
                </button>
              </form>
              <form action={decline} className="flex-1">
                <button type="submit" className="w-full py-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-base transition-colors">
                  Decline
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
