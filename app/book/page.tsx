'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { submitBooking } from '@/app/actions/booking'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SERVICES = [
  'Full Tune-Up',
  'Oil Change',
  'Blade Sharpening',
  'Spark Plug Replacement',
  'Carburetor Cleaning',
  'Belt Replacement',
  'Air Filter Replacement',
  'Diagnostics & Minor Repair',
  'Trailer Lighting & Wiring',
  'Trailer Brakes',
  'Jack Replacement',
  'Axle Replacement',
]


const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400'

export default function BookPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(submitBooking, undefined)

  useEffect(() => {
    if (state?.success) router.push('/book/success')
  }, [state, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-gray-900">Ellis Mobile Repair</Link>
          <a href="tel:+17123265651" className="text-sm text-green-600 font-medium">(712) 326-5651</a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Schedule Service</h1>
          <p className="text-gray-500 text-sm mt-1">Fill out the form below and we'll contact you to confirm your appointment.</p>
        </div>

        <form action={action} className="space-y-6">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
              {state.error}
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Your Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input name="name" type="text" required placeholder="John Smith" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                <input name="phone" type="tel" required placeholder="(402) 555-0000" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input name="email" type="email" required placeholder="you@email.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Street Address *</label>
              <input name="address" type="text" required placeholder="123 Main St" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
              <input name="city" type="text" required placeholder="e.g. Council Bluffs, Omaha, Underwood..." className={inputCls} />
            </div>
          </div>

          {/* Equipment */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Your Equipment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                <select name="equipmentType" required className={inputCls}>
                  <option value="">Select...</option>
                  <option>Push Mower</option>
                  <option>Self-Propelled Mower</option>
                  <option>Riding Mower</option>
                  <option>Zero-Turn Mower</option>
                  <option>Tractor</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Make / Brand</label>
                <input name="equipmentMake" type="text" placeholder="e.g. Honda, Husqvarna" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                <input name="equipmentYear" type="text" placeholder="e.g. 2018" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-gray-900">Services Needed *</h2>
            <p className="text-xs text-gray-400">Select all that apply</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SERVICES.map(s => (
                <label key={s} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" name="services" value={s} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm text-gray-700">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Issues & Date */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Details</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Describe the issue or what you need done *</label>
              <textarea
                name="issues"
                required
                rows={4}
                placeholder="e.g. Mower won't start, ran out of oil, needs annual tune-up before season..."
                className={inputCls + ' resize-none'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Preferred Date *</label>
              <input name="preferredDate" type="date" required className={inputCls}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 rounded-xl font-bold text-white text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
          >
            {pending ? 'Submitting…' : 'Request Appointment'}
          </button>

          <p className="text-center text-xs text-gray-400">
            We'll reach out within 24 hours to confirm your appointment.
          </p>
        </form>
      </main>
    </div>
  )
}
