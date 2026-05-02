import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { logout } from '@/app/actions/auth'
import { AdminNav } from '@/components/AdminNav'
import { JobsClient } from '@/components/JobsClient'

export const dynamic = 'force-dynamic'

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ customerId?: string }> }) {
  await verifyAdmin()
  const { customerId } = await searchParams

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, phone: true, city: true,
      equipmentType: true, equipmentMake: true, engineModel: true, equipmentPhoto: true, services: true, issues: true,
      preferredDate: true, status: true, isManual: true,
      receiptToken: true, receiptSentAt: true, squarePaymentUrl: true,
      quoteToken: true, quoteAmount: true, quoteSentAt: true,
      quoteViewedAt: true, quoteResponse: true,
      lineItems: true, subtotal: true, discountAmount: true,
      discountNote: true, taxRate: true, taxAmount: true,
      grandTotal: true, quoteNotes: true,
      isPaid: true, paidAt: true, paymentMethod: true,
      expenseCost: true, expenseNotes: true, createdAt: true,
    },
  })

  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, phone: true, email: true },
    orderBy: { name: 'asc' },
  })

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
        <JobsClient bookings={bookings} customers={customers} preselectedCustomerId={customerId} />
      </main>
    </div>
  )
}
