'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminNav() {
  const path = usePathname()
  const isBookings = path === '/admin' || path.startsWith('/admin') && !path.startsWith('/admin/customers')
  const isCustomers = path.startsWith('/admin/customers')

  return (
    <div className="flex gap-2 mb-5">
      <Link
        href="/admin"
        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors border
          ${isBookings ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900'}`}
      >
        Bookings
      </Link>
      <Link
        href="/admin/customers"
        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors border
          ${isCustomers ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900'}`}
      >
        Customers
      </Link>
    </div>
  )
}
