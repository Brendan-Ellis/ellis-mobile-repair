import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { logout } from '@/app/actions/auth'
import { AdminNav } from '@/components/AdminNav'
import { CustomersClient } from '@/components/CustomersClient'

export default async function CustomersPage() {
  await verifyAdmin()

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { equipment: { include: { serviceRecords: true } } },
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
        <CustomersClient customers={customers} />
      </main>
    </div>
  )
}
