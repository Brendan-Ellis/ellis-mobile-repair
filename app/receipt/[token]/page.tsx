import { prisma } from '@/lib/prisma'
import { DISCLAIMER } from '@/lib/tax'
import type { LineItem } from '@/app/actions/jobs'
import Link from 'next/link'
import { PrintButton } from '@/components/PrintButton'

export const dynamic = 'force-dynamic'

export default async function ReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const booking = await prisma.booking.findUnique({ where: { receiptToken: token } })

  if (!booking || !booking.isPaid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl mb-3">🔍</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Receipt Not Found</h1>
          <p className="text-gray-500 text-sm">This link may be invalid or expired.</p>
          <p className="text-sm text-gray-400 mt-4">Call us at <a href="tel:+17123265651" className="text-green-600 font-medium">(712) 326-5651</a></p>
        </div>
      </div>
    )
  }

  const lineItems = booking.lineItems as LineItem[] | null
  const hasLineItems = lineItems && lineItems.length > 0
  const total = booking.grandTotal ?? booking.quoteAmount ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-gray-900">Ellis Mobile Repair</Link>
          <PrintButton />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-0 print:rounded-none">

          {/* Receipt header */}
          <div className="bg-gray-900 text-white px-6 py-6 text-center">
            <p className="text-xl font-bold">Ellis Mobile Repair</p>
            <p className="text-gray-400 text-sm mt-1">Small Engine Repair · Mobile Service</p>
            <p className="text-gray-400 text-sm">(712) 326-5651 · ellismobilerepair.com</p>
            <p className="text-gray-400 text-sm">Council Bluffs, IA · Omaha, NE</p>
          </div>

          <div className="px-6 py-6 space-y-5">
            {/* Receipt meta */}
            <div className="flex justify-between items-start text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Bill To</p>
                <p className="font-semibold text-gray-900">{booking.name}</p>
                {booking.phone && <p className="text-gray-500">{booking.phone}</p>}
                {booking.email && <p className="text-gray-500">{booking.email}</p>}
                {booking.city && <p className="text-gray-500">{booking.city}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Date Paid</p>
                <p className="font-semibold text-gray-900">
                  {booking.paidAt ? new Date(booking.paidAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-400 mt-2 mb-0.5">Payment Method</p>
                <p className="font-medium text-gray-700 capitalize">{booking.paymentMethod ?? '—'}</p>
              </div>
            </div>

            {/* Equipment */}
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="text-xs text-gray-400 mb-1">Equipment Serviced</p>
              <p className="font-medium text-gray-800">{booking.equipmentType}{booking.equipmentMake ? ` — ${booking.equipmentMake}` : ''}</p>
              {booking.services.length > 0 && <p className="text-gray-500 mt-0.5">{booking.services.join(', ')}</p>}
            </div>

            {/* Line items */}
            {hasLineItems ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 text-left text-gray-500 font-medium">Description</th>
                    <th className="py-2 text-center text-gray-500 font-medium">Qty</th>
                    <th className="py-2 text-right text-gray-500 font-medium">Unit</th>
                    <th className="py-2 text-right text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={item.id} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <td className="py-2.5 text-gray-900">{item.description}</td>
                      <td className="py-2.5 text-center text-gray-600">{item.qty}</td>
                      <td className="py-2.5 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-medium text-gray-900">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="py-2 text-right text-gray-500 text-xs">Subtotal</td>
                    <td className="py-2 text-right text-gray-700">${(booking.subtotal ?? 0).toFixed(2)}</td>
                  </tr>
                  {(booking.discountAmount ?? 0) > 0 && (
                    <tr>
                      <td colSpan={3} className="py-2 text-right text-gray-500 text-xs">
                        Discount{booking.discountNote ? ` — ${booking.discountNote}` : ''}
                      </td>
                      <td className="py-2 text-right text-red-600">-${booking.discountAmount!.toFixed(2)}</td>
                    </tr>
                  )}
                  {(booking.taxRate ?? 0) > 0 && (
                    <tr>
                      <td colSpan={3} className="py-2 text-right text-gray-500 text-xs">Tax ({booking.taxRate}%)</td>
                      <td className="py-2 text-right text-gray-700">${(booking.taxAmount ?? 0).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-gray-900">
                    <td colSpan={3} className="py-3 text-right font-bold text-gray-900">Total Paid</td>
                    <td className="py-3 text-right text-xl font-bold text-green-600">${total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="border-t border-b border-gray-200 py-4">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total Paid</span>
                  <span className="text-green-600 text-xl">${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {booking.quoteNotes && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-gray-700">{booking.quoteNotes}</p>
              </div>
            )}

            {/* Thank you */}
            <div className="text-center pt-2 border-t border-gray-100">
              <p className="font-semibold text-gray-900">Thank you for your business!</p>
              <p className="text-xs text-gray-400 mt-1">Questions? Call <a href="tel:+17123265651" className="text-green-600">(712) 326-5651</a></p>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">{DISCLAIMER}</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 print:hidden">
          Use your browser&apos;s Print or Save as PDF to keep a copy.
        </p>
      </main>

      <style>{`
        @media print {
          header, .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}
