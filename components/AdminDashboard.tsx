'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Booking } from '@/app/generated/prisma/client'
import { updateBookingStatus, updateBookingDetails, markInvoiceSent, deleteBooking } from '@/app/actions/booking'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

const FILTERS = ['all', 'pending', 'accepted', 'in_progress', 'completed', 'declined']

export function AdminDashboard({
  bookings,
  statusCounts,
  currentFilter,
}: {
  bookings: Booking[]
  statusCounts: Record<string, number>
  currentFilter: string
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Booking | null>(null)

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => router.push(f === 'all' ? '/admin' : `/admin?status=${f}`)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors border
              ${currentFilter === f
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900'}`}
          >
            {STATUS_LABELS[f] ?? 'All'} {statusCounts[f] ? `(${statusCounts[f]})` : ''}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center text-gray-400 shadow-sm">
          No bookings found.
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{b.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                      {b.invoiceSent && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Invoice Sent</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{b.city} · {b.phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.equipmentType}{b.equipmentMake ? ` · ${b.equipmentMake}` : ''}{b.equipmentYear ? ` · ${b.equipmentYear}` : ''}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {b.services.map(s => (
                        <span key={s} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">{s}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">"{b.issues}"</p>
                    <p className="text-xs text-gray-400 mt-1">Preferred: {b.preferredDate} · Submitted: {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <button
                    onClick={() => setSelected(b)}
                    className="flex-shrink-0 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <BookingModal booking={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function BookingModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [adminNotes, setAdminNotes] = useState(booking.adminNotes ?? '')
  const [partsUsed, setPartsUsed] = useState(booking.partsUsed ?? '')
  const [laborHours, setLaborHours] = useState(String(booking.laborHours ?? ''))
  const [price, setPrice] = useState(String(booking.price ?? ''))
  const [saving, setSaving] = useState(false)

  function save() {
    setSaving(true)
    startTransition(async () => {
      await updateBookingDetails(
        booking.id,
        adminNotes,
        partsUsed,
        laborHours ? parseFloat(laborHours) : null,
        price ? parseFloat(price) : null,
      )
      router.refresh()
      setSaving(false)
      onClose()
    })
  }

  function changeStatus(status: string) {
    startTransition(async () => {
      await updateBookingStatus(booking.id, status)
      router.refresh()
      onClose()
    })
  }

  function sendInvoice() {
    startTransition(async () => {
      await markInvoiceSent(booking.id)
      router.refresh()
      onClose()
    })
  }

  function remove() {
    if (!confirm('Delete this booking?')) return
    startTransition(async () => {
      await deleteBooking(booking.id)
      router.refresh()
      onClose()
    })
  }

  const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h3 className="font-semibold text-gray-900">{booking.name}</h3>
            <p className="text-xs text-gray-400">{booking.city} · {booking.phone} · {booking.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Booking details */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
            <p><span className="text-gray-400">Address:</span> <span className="text-gray-700">{booking.address}, {booking.city}</span></p>
            <p><span className="text-gray-400">Equipment:</span> <span className="text-gray-700">{booking.equipmentType}{booking.equipmentMake ? ` · ${booking.equipmentMake}` : ''}{booking.equipmentYear ? ` (${booking.equipmentYear})` : ''}</span></p>
            <p><span className="text-gray-400">Preferred date:</span> <span className="text-gray-700">{booking.preferredDate}</span></p>
            <p><span className="text-gray-400">Services:</span> <span className="text-gray-700">{booking.services.join(', ')}</span></p>
            <p><span className="text-gray-400">Issue:</span> <span className="text-gray-700 italic">"{booking.issues}"</span></p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Update Status</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => changeStatus(val)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
                    ${booking.status === val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Job details */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-600">Admin Notes</label>
            <textarea rows={3} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className={inputCls + ' resize-none'} placeholder="Internal notes..." />
            <label className="block text-xs font-medium text-gray-600">Parts Used</label>
            <input type="text" value={partsUsed} onChange={e => setPartsUsed(e.target.value)} className={inputCls} placeholder="e.g. Spark plug, oil filter..." />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Labor Hours</label>
                <input type="number" value={laborHours} onChange={e => setLaborHours(e.target.value)} min="0" step="0.25" className={inputCls} placeholder="1.5" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Total Price ($)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" className={inputCls} placeholder="75.00" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? '…' : 'Save'}
            </button>
          </div>

          <div className="flex gap-3 pt-1 border-t border-gray-100">
            {!booking.invoiceSent && (
              <button onClick={sendInvoice} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Mark Invoice Sent
              </button>
            )}
            <button onClick={remove} className="text-xs text-red-500 hover:text-red-700 transition-colors ml-auto">
              Delete Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
