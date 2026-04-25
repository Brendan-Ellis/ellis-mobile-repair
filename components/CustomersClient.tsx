'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCustomer, deleteCustomer } from '@/app/actions/customers'
import type { Customer, Equipment, ServiceRecord } from '@/app/generated/prisma/client'

type CustomerWithEquipment = Customer & {
  equipment: (Equipment & { serviceRecords: ServiceRecord[] })[]
}

const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400'

export function CustomersClient({ customers }: { customers: CustomerWithEquipment[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await createCustomer(formData)
      router.refresh()
      setShowAdd(false)
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name} and all their equipment/service history?`)) return
    startTransition(async () => {
      await deleteCustomer(id)
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={inputCls + ' max-w-xs'}
        />
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          + Add Customer
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center text-gray-400 shadow-sm">
          {search ? 'No customers match your search.' : 'No customers yet. Add your first one!'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const totalJobs = c.equipment.reduce((sum, e) => sum + e.serviceRecords.length, 0)
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.phone}{c.city ? ` · ${c.city}` : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.equipment.length} mower{c.equipment.length !== 1 ? 's' : ''} · {totalJobs} service{totalJobs !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Add Customer</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form action={handleAdd} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input name="name" required placeholder="John Smith" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input name="phone" type="tel" placeholder="(402) 555-0000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input name="city" placeholder="Council Bluffs" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input name="email" type="email" placeholder="john@email.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input name="address" placeholder="123 Main St" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea name="notes" rows={2} placeholder="Any notes about this customer..." className={inputCls + ' resize-none'} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
