import { prisma } from '@/lib/prisma'
import { respondToQuote } from '@/app/actions/booking'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ response?: string }>
}) {
  const { token } = await params
  const { response } = await searchParams

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

  // Handle accept/decline from email link
  if (response === 'accepted' || response === 'declined') {
    if (!booking.quoteResponse) {
      await respondToQuote(token, response)
    }
    redirect(`/quote/${token}`)
  }

  const alreadyResponded = !!booking.quoteResponse

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
                <div className="text-5xl mb-4">✅</div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Quote Accepted!</h1>
                <p className="text-gray-500 text-sm">We'll be in touch shortly to confirm your appointment.</p>
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

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Customer</span>
                <span className="font-medium text-gray-900 text-sm">{booking.name}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Services</span>
                <span className="font-medium text-gray-900 text-sm text-right max-w-[60%]">{booking.services.join(', ')}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Preferred Date</span>
                <span className="font-medium text-gray-900 text-sm">{booking.preferredDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Estimated Total</span>
                <span className="text-2xl font-bold text-green-600">${booking.quoteAmount.toFixed(2)}</span>
              </div>
            </div>

            {booking.quoteMessage && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Note from Ellis Mobile Repair</p>
                <p className="text-sm text-gray-700">{booking.quoteMessage}</p>
              </div>
            )}

            <p className="text-xs text-gray-400">Parts and materials may be additional. Final price confirmed before work begins.</p>

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
