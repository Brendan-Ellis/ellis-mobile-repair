import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { logout } from '@/app/actions/auth'
import { AdminNav } from '@/components/AdminNav'
import { RevenueClient } from '@/components/RevenueClient'
import { markTaxPaid, unmarkTaxPaid } from '@/app/actions/tax'

export const dynamic = 'force-dynamic'

export default async function RevenuePage() {
  await verifyAdmin()

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { isPaid: true },
        { status: 'accepted', grandTotal: { not: null } },
        { status: 'in_progress', grandTotal: { not: null } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      city: true,
      equipmentType: true,
      services: true,
      status: true,
      isPaid: true,
      paidAt: true,
      paymentMethod: true,
      grandTotal: true,
      subtotal: true,
      taxAmount: true,
      taxRate: true,
      discountAmount: true,
      quoteAmount: true,
      expenseCost: true,
      expenseNotes: true,
      createdAt: true,
    },
  })

  const taxPayments = await prisma.taxPayment.findMany({ orderBy: { quarter: 'desc' } })

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <p className="font-bold text-gray-900">Ellis Mobile Repair</p>
          <p className="text-xs text-gray-500">Admin Dashboard</p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
            Sign out
          </button>
        </form>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <AdminNav />
        <RevenueClient bookings={bookings} taxPayments={taxPayments} markTaxPaid={markTaxPaid} unmarkTaxPaid={unmarkTaxPaid} />
      </main>
    </div>
  )
}
