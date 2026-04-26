'use client'

import { useState, useMemo, useTransition } from 'react'

type TaxPayment = {
  id: string
  quarter: string
  type: string
  owed: number
  paidAt: Date | null
  paidAmount: number | null
  notes: string | null
}

type BookingSummary = {
  id: string
  name: string
  city: string
  equipmentType: string
  services: string[]
  status: string
  isPaid: boolean
  paidAt: Date | null
  paymentMethod: string | null
  grandTotal: number | null
  subtotal: number | null
  taxAmount: number | null
  taxRate: number | null
  discountAmount: number | null
  quoteAmount: number | null
  expenseCost: number | null
  expenseNotes: string | null
  createdAt: Date
}

const PERIODS = [
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
]

function getPeriodRange(period: string): [Date, Date] {
  const now = new Date()
  if (period === 'month') {
    return [new Date(now.getFullYear(), now.getMonth(), 1), now]
  }
  if (period === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    return [start, end]
  }
  if (period === 'year') {
    return [new Date(now.getFullYear(), 0, 1), now]
  }
  return [new Date(0), now]
}

function getQuarter(date: Date): string {
  const q = Math.floor(date.getMonth() / 3) + 1
  return `${date.getFullYear()}-Q${q}`
}

function quarterLabel(q: string): string {
  const [year, quarter] = q.split('-')
  const labels: Record<string, string> = { Q1: 'Jan–Mar', Q2: 'Apr–Jun', Q3: 'Jul–Sep', Q4: 'Oct–Dec' }
  return `${labels[quarter] ?? quarter} ${year}`
}

function quarterDueDate(q: string): string {
  const [year, quarter] = q.split('-')
  const y = parseInt(year)
  const dues: Record<string, string> = {
    Q1: `April 15, ${y}`,
    Q2: `June 15, ${y}`,
    Q3: `September 15, ${y}`,
    Q4: `January 15, ${y + 1}`,
  }
  return dues[quarter] ?? ''
}

export function RevenueClient({
  bookings,
  taxPayments,
  markTaxPaid,
  unmarkTaxPaid,
}: {
  bookings: BookingSummary[]
  taxPayments: TaxPayment[]
  markTaxPaid: (quarter: string, type: string, owed: number, paidAmount: number, notes: string) => Promise<void>
  unmarkTaxPaid: (quarter: string, type: string) => Promise<void>
}) {
  const [period, setPeriod] = useState('month')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'revenue' | 'taxes'>('revenue')

  const [start, end] = getPeriodRange(period)

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const date = b.isPaid && b.paidAt ? new Date(b.paidAt) : new Date(b.createdAt)
      const inPeriod = date >= start && date <= end
      const matchPayment = paymentFilter === 'all' || b.paymentMethod === paymentFilter
      return inPeriod && matchPayment
    })
  }, [bookings, start, end, paymentFilter])

  const paid = filtered.filter(b => b.isPaid)
  const outstanding = filtered.filter(b => !b.isPaid && (b.status === 'accepted' || b.status === 'in_progress') && (b.grandTotal ?? b.quoteAmount))

  function squareFee(amount: number) {
    return Math.round((amount * 0.026 + 0.10) * 100) / 100
  }
  function jobFee(b: typeof paid[0]) {
    return b.paymentMethod === 'card' ? squareFee(b.grandTotal ?? b.quoteAmount ?? 0) : 0
  }

  const totalRevenue = paid.reduce((s, b) => s + (b.grandTotal ?? b.quoteAmount ?? 0), 0)
  const totalFees = paid.reduce((s, b) => s + jobFee(b), 0)
  const totalNetRevenue = totalRevenue - totalFees
  const totalTax = paid.reduce((s, b) => s + (b.taxAmount ?? 0), 0)
  const totalExpenses = paid.reduce((s, b) => s + (b.expenseCost ?? 0), 0)
  const totalProfit = totalNetRevenue - totalExpenses
  const totalOutstanding = outstanding.reduce((s, b) => s + (b.grandTotal ?? b.quoteAmount ?? 0), 0)

  const paymentMethods = ['cash', 'check', 'card', 'venmo', 'zelle', 'paypal', 'other']

  // Build quarterly tax data from ALL paid bookings
  const quarterlyTax = useMemo(() => {
    const map: Record<string, { iowa: number; nebraska: number; profit: number }> = {}
    for (const b of bookings) {
      if (!b.isPaid) continue
      const date = b.paidAt ? new Date(b.paidAt) : new Date(b.createdAt)
      const q = getQuarter(date)
      if (!map[q]) map[q] = { iowa: 0, nebraska: 0, profit: 0 }
      const tax = b.taxAmount ?? 0
      const rate = b.taxRate ?? 0
      const amount = b.grandTotal ?? b.quoteAmount ?? 0
      const fee = b.paymentMethod === 'card' ? Math.round((amount * 0.026 + 0.10) * 100) / 100 : 0
      const expense = b.expenseCost ?? 0
      if (rate === 6.0) map[q].iowa += tax
      else if (rate === 5.5) map[q].nebraska += tax
      map[q].profit += (amount - fee - expense)
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([quarter, data]) => ({
        quarter,
        iowa: Math.round(data.iowa * 100) / 100,
        nebraska: Math.round(data.nebraska * 100) / 100,
        federalEstimate: Math.round(data.profit * 0.25 * 100) / 100,
        iowaPaid: taxPayments.find(t => t.quarter === quarter && t.type === 'iowa'),
        nebraskaPaid: taxPayments.find(t => t.quarter === quarter && t.type === 'nebraska'),
        federalPaid: taxPayments.find(t => t.quarter === quarter && t.type === 'federal'),
      }))
  }, [bookings, taxPayments])

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setActiveTab('revenue')} className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-colors ${activeTab === 'revenue' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>Revenue</button>
        <button onClick={() => setActiveTab('taxes')} className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-colors ${activeTab === 'taxes' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>Tax Tracker</button>
      </div>

      {activeTab === 'taxes' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-700">
            <p className="font-semibold mb-1">Quarterly Tax Guide</p>
            <p>Iowa & Nebraska sales tax due quarterly to each state. Federal estimated tax due quarterly to IRS. Federal estimate = 25% of your profit (adjust based on your accountant's advice).</p>
          </div>

          {quarterlyTax.length === 0 && (
            <p className="text-center text-gray-400 py-10 text-sm">No paid jobs yet — tax data will appear here.</p>
          )}

          {quarterlyTax.map(q => (
            <div key={q.quarter} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{quarterLabel(q.quarter)}</p>
                  <p className="text-xs text-gray-400">Due {quarterDueDate(q.quarter)}</p>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  Total owed: <span className="text-gray-900 font-bold">${(q.iowa + q.nebraska + q.federalEstimate).toFixed(2)}</span>
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { type: 'iowa', label: 'Iowa Sales Tax (6%)', owed: q.iowa, paid: q.iowaPaid, color: 'text-blue-600', site: 'tax.iowa.gov' },
                  { type: 'nebraska', label: 'Nebraska Sales Tax (5.5%)', owed: q.nebraska, paid: q.nebraskaPaid, color: 'text-purple-600', site: 'revenue.nebraska.gov' },
                  { type: 'federal', label: 'Federal Est. Tax (~25% profit)', owed: q.federalEstimate, paid: q.federalPaid, color: 'text-orange-600', site: 'irs.gov/payments' },
                ].map(row => (
                  row.owed > 0 || row.paid ? (
                    <div key={row.type} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{row.label}</p>
                        <p className="text-xs text-gray-400">{row.site}</p>
                        {row.paid?.paidAt && (
                          <p className="text-xs text-green-600 mt-0.5">
                            Paid ${(row.paid.paidAmount ?? row.owed).toFixed(2)} on {new Date(row.paid.paidAt).toLocaleDateString()}
                            {row.paid.notes ? ` — ${row.paid.notes}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${row.paid?.paidAt ? 'line-through text-gray-400' : row.color}`}>
                          ${row.owed.toFixed(2)}
                        </span>
                        {row.paid?.paidAt ? (
                          <button
                            onClick={() => startTransition(() => unmarkTaxPaid(q.quarter, row.type))}
                            disabled={isPending}
                            className="text-xs text-gray-400 hover:text-red-500 underline"
                          >
                            Undo
                          </button>
                        ) : (
                          <button
                            onClick={() => startTransition(() => markTaxPaid(q.quarter, row.type, row.owed, row.owed, ''))}
                            disabled={isPending || row.owed === 0}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'revenue' && <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-900">Revenue</h2>
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors
                ${period === p.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600 mt-1">${totalNetRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{paid.length} paid job{paid.length !== 1 ? 's' : ''}{totalFees > 0 ? ` · -$${totalFees.toFixed(2)} fees` : ''}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">${totalOutstanding.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{outstanding.length} accepted, not yet paid</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Tax Collected</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">${totalTax.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">State sales tax</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Est. Profit</p>
          <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>${totalProfit.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">${totalExpenses.toFixed(2)} in expenses</p>
        </div>
      </div>

      {/* P&L note */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-xs text-blue-700">
        <p className="font-semibold mb-1">About Federal Taxes</p>
        <p>The tax amounts above are <strong>state/local sales tax</strong> collected from customers (Iowa 6%, Nebraska 5.5%). Federal income tax on your business profit is separate — you pay that yourself based on your net income. Keep this P&amp;L report handy for tax time and share it with your accountant. Expense tracking here helps reduce your taxable income.</p>
      </div>

      {/* Payment method filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setPaymentFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors
            ${paymentFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}
        >
          All Methods
        </button>
        {paymentMethods.map(m => (
          <button
            key={m}
            onClick={() => setPaymentFilter(m)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors capitalize
              ${paymentFilter === m ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        {paid.length === 0 && outstanding.length === 0 && (
          <p className="text-center text-gray-400 py-12 text-sm">No revenue data for this period.</p>
        )}

        {outstanding.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 px-1 mt-2">OUTSTANDING</p>
            {outstanding.map(b => (
              <div key={b.id} className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.city} · {b.equipmentType}</p>
                  <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-500">${(b.grandTotal ?? b.quoteAmount ?? 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-400 capitalize">{b.status.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </>
        )}

        {paid.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 px-1 mt-4">PAID</p>
            {paid.map(b => (
              <div key={b.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.city} · {b.equipmentType}</p>
                  <p className="text-xs text-gray-400">
                    {b.paidAt ? new Date(b.paidAt).toLocaleDateString() : new Date(b.createdAt).toLocaleDateString()}
                    {b.paymentMethod && <span className="ml-1 capitalize">· {b.paymentMethod}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${(b.grandTotal ?? b.quoteAmount ?? 0).toFixed(2)}</p>
                  {jobFee(b) > 0 && <p className="text-xs text-orange-500">Square fee: -${jobFee(b).toFixed(2)}</p>}
                  {(b.taxAmount ?? 0) > 0 && <p className="text-xs text-gray-400">Tax: ${b.taxAmount!.toFixed(2)}</p>}
                  {b.expenseCost != null && (
                    <p className="text-xs text-gray-400">
                      Profit: <span className="text-green-600 font-medium">${((b.grandTotal ?? b.quoteAmount ?? 0) - jobFee(b) - b.expenseCost).toFixed(2)}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      </>}
    </div>
  )
}
