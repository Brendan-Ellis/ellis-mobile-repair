import { verifyAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { logout } from '@/app/actions/auth'
import { AdminDashboard } from '@/components/AdminDashboard'

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await verifyAdmin()
  const params = await searchParams
  const statusFilter = params.status ?? 'all'

  const bookings = await prisma.booking.findMany({
    where: statusFilter !== 'all' ? { status: statusFilter } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  const counts = await prisma.booking.groupBy({
    by: ['status'],
    _count: true,
  })
  const total = await prisma.booking.count()

  const statusCounts: Record<string, number> = { all: total }
  for (const c of counts) statusCounts[c.status] = c._count

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
        <AdminDashboard bookings={bookings} statusCounts={statusCounts} currentFilter={statusFilter} />
      </main>
    </div>
  )
}
