'use client'

import { useState, useTransition, useMemo, useEffect, useRef } from 'react'
import {
  saveQuoteLineItems,
  sendLineItemQuote,
  sendReceipt,
  sendPaymentRequest,
  markJobPaid,
  markJobUnpaid,
  saveJobExpenses,
  updateJobStatus,
  createManualJob,
  type LineItem,
} from '@/app/actions/jobs'

type Booking = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  equipmentType: string
  equipmentMake: string | null
  services: string[]
  issues: string
  preferredDate: string
  status: string
  isManual: boolean
  receiptToken: string | null
  receiptSentAt: Date | null
  quoteToken: string | null
  squarePaymentUrl: string | null
  quoteAmount: number | null
  quoteSentAt: Date | null
  quoteViewedAt: Date | null
  quoteResponse: string | null
  lineItems: unknown
  subtotal: number | null
  discountAmount: number | null
  discountNote: string | null
  taxRate: number | null
  taxAmount: number | null
  grandTotal: number | null
  quoteNotes: string | null
  isPaid: boolean
  paidAt: Date | null
  paymentMethod: string | null
  expenseCost: number | null
  expenseNotes: string | null
  createdAt: Date
}

type Customer = { id: string; name: string; phone: string | null; email: string | null }

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  quote_sent: 'Quote Sent',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  quote_sent: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
}

function newLineItem(): LineItem {
  return { id: Math.random().toString(36).slice(2), description: '', qty: 1, unitPrice: 0, total: 0 }
}

export function JobsClient({ bookings, customers, preselectedCustomerId }: { bookings: Booking[]; customers: Customer[]; preselectedCustomerId?: string }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [showManual, setShowManual] = useState(!!preselectedCustomerId)
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    preselectedCustomerId ? (customers.find(c => c.id === preselectedCustomerId) ?? null) : null
  )
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()

  // Line item state for selected job
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [discount, setDiscount] = useState('')
  const [discountNote, setDiscountNote] = useState('')
  const [taxOverride, setTaxOverride] = useState('')
  const [quoteNotes, setQuoteNotes] = useState('')
  const [receiptToken, setReceiptToken] = useState<string | null>(null)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [expenseCost, setExpenseCost] = useState('')
  const [expenseNotes, setExpenseNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [quoteSent, setQuoteSent] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function openJob(b: Booking) {
    setSelected(b)
    setLineItems((b.lineItems as LineItem[]) ?? [])
    setDiscount(b.discountAmount?.toString() ?? '')
    setDiscountNote(b.discountNote ?? '')
    setTaxOverride(b.taxRate != null ? b.taxRate.toString() : '')
    setQuoteNotes(b.quoteNotes ?? '')
    setExpenseCost(b.expenseCost?.toString() ?? '')
    setExpenseNotes(b.expenseNotes ?? '')
    setPaymentMethod('cash')
    setQuoteSent(false)
    setReceiptToken(null)
    setPaymentLink(null)
  }

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setLineItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === 'qty' || field === 'unitPrice') {
          updated.total = Math.round(Number(updated.qty) * Number(updated.unitPrice) * 100) / 100
        }
        return updated
      })
    )
  }

  // Computed totals
  const subtotal = lineItems.reduce((s, i) => s + i.total, 0)
  const discountAmt = parseFloat(discount) || 0
  const taxRate = taxOverride !== '' ? parseFloat(taxOverride) : (selected ? autoTaxRate(selected.city) : 0)
  const taxable = subtotal - discountAmt
  const taxAmt = Math.round(taxable * (taxRate / 100) * 100) / 100
  const grandTotal = taxable + taxAmt

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchStatus = statusFilter === 'all' || b.status === statusFilter
      const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.phone.includes(search) || b.city.toLowerCase().includes(search.toLowerCase()) ||
        b.equipmentType.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [bookings, search, statusFilter])

  function handleSaveQuote() {
    if (!selected) return
    startTransition(async () => {
      await saveQuoteLineItems(selected.id, lineItems, discountAmt || null, discountNote, taxOverride !== '' ? parseFloat(taxOverride) : null, quoteNotes)
      showToast('Quote saved!')
      window.location.reload()
    })
  }

  function handleSendQuote() {
    if (!selected) return
    startTransition(async () => {
      await saveQuoteLineItems(selected.id, lineItems, discountAmt || null, discountNote, taxOverride !== '' ? parseFloat(taxOverride) : null, quoteNotes)
      await sendLineItemQuote(selected.id)
      setQuoteSent(true)
      showToast('Quote sent to customer!')
      window.location.reload()
    })
  }

  function handleMarkPaid() {
    if (!selected) return
    startTransition(async () => {
      await markJobPaid(selected.id, paymentMethod)
      showToast('Marked as paid!')
      window.location.reload()
    })
  }

  function handleMarkUnpaid() {
    if (!selected) return
    startTransition(async () => {
      await markJobUnpaid(selected.id)
      showToast('Marked as unpaid.')
      window.location.reload()
    })
  }

  function handleSaveExpenses() {
    if (!selected) return
    startTransition(async () => {
      await saveJobExpenses(selected.id, parseFloat(expenseCost) || null, expenseNotes)
      showToast('Expenses saved!')
      window.location.reload()
    })
  }

  function handleStatusChange(status: string) {
    if (!selected) return
    startTransition(async () => {
      await updateJobStatus(selected.id, status)
      showToast('Status updated.')
      window.location.reload()
    })
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-gray-900">Jobs</h2>
        <button
          onClick={() => setShowManual(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          + New Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, phone, city..."
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[180px] outline-none focus:border-gray-400"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Jobs list */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">No jobs found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => (
            <button
              key={b.id}
              onClick={() => openJob(b)}
              className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-gray-400 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{b.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                    {b.isPaid && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">Paid</span>}
                    {b.isManual && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Manual</span>}
                    {isQuoteExpired(b.quoteSentAt) && !b.quoteResponse && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">Expired</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{b.city} · {b.equipmentType}{b.equipmentMake ? ` · ${b.equipmentMake}` : ''}</p>
                  {b.services.length > 0 && <p className="text-xs text-gray-400 mt-0.5 truncate">{b.services.join(', ')}</p>}
                </div>
                <div className="text-right shrink-0">
                  {b.grandTotal ? (
                    <p className="text-sm font-bold text-gray-900">${b.grandTotal.toFixed(2)}</p>
                  ) : b.quoteAmount ? (
                    <p className="text-sm font-bold text-gray-900">${b.quoteAmount.toFixed(2)}</p>
                  ) : null}
                  <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Job detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-start justify-center p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{selected.name}</p>
                <p className="text-xs text-gray-400">{selected.phone} · {selected.email} · {selected.city}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Job info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Equipment</p>
                  <p className="font-medium text-gray-800">{selected.equipmentType}{selected.equipmentMake ? ` — ${selected.equipmentMake}` : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Preferred Date</p>
                  <p className="font-medium text-gray-800">{selected.preferredDate}</p>
                </div>
                {selected.services.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Services Requested</p>
                    <p className="font-medium text-gray-800">{selected.services.join(', ')}</p>
                  </div>
                )}
                {selected.issues && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Issue Description</p>
                    <p className="text-gray-700 text-sm">{selected.issues}</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">STATUS</p>
                <div className="flex gap-2 flex-wrap">
                  {['accepted', 'in_progress', 'completed', 'declined'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={isPending}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                        ${selected.status === s ? `${STATUS_COLORS[s]} border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line item quote builder */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">QUOTE / LINE ITEMS</p>

                {lineItems.length === 0 ? (
                  <p className="text-xs text-gray-400 mb-2">No line items yet.</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden mb-2">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-500 font-medium text-xs">Description</th>
                          <th className="px-2 py-2 text-center text-gray-500 font-medium text-xs w-14">Qty</th>
                          <th className="px-2 py-2 text-right text-gray-500 font-medium text-xs w-20">Unit $</th>
                          <th className="px-2 py-2 text-right text-gray-500 font-medium text-xs w-20">Total</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map(item => (
                          <tr key={item.id} className="border-t border-gray-100">
                            <td className="px-2 py-1.5">
                              <input
                                value={item.description}
                                onChange={e => updateItem(item.id, 'description', e.target.value)}
                                placeholder="e.g. Oil Change"
                                className="w-full text-sm outline-none border-b border-transparent focus:border-gray-300 bg-transparent py-0.5"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={item.qty === 0 ? '' : item.qty}
                                onChange={e => {
                                  const val = e.target.value
                                  if (val === '') {
                                    updateItem(item.id, 'qty', 0)
                                  } else {
                                    const n = parseFloat(val)
                                    if (!isNaN(n)) updateItem(item.id, 'qty', n)
                                  }
                                }}
                                placeholder="1"
                                className="w-full text-sm text-center outline-none border-b border-transparent focus:border-gray-300 bg-transparent"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.unitPrice === 0 ? '' : item.unitPrice}
                                onChange={e => {
                                  const val = e.target.value
                                  if (val === '' || val === '.') {
                                    updateItem(item.id, 'unitPrice', 0)
                                  } else {
                                    const n = parseFloat(val)
                                    if (!isNaN(n)) updateItem(item.id, 'unitPrice', n)
                                  }
                                }}
                                placeholder="0.00"
                                className="w-full text-sm text-right outline-none border-b border-transparent focus:border-gray-300 bg-transparent"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-right text-sm font-medium text-gray-800">
                              ${item.total.toFixed(2)}
                            </td>
                            <td className="px-1 py-1.5">
                              <button onClick={() => setLineItems(prev => prev.filter(i => i.id !== item.id))} className="text-gray-300 hover:text-red-500 text-base leading-none">×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  onClick={() => setLineItems(prev => [...prev, newLineItem()])}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium mb-3"
                >
                  + Add Line Item
                </button>

                {/* Discount */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-500">Discount ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Discount Note (shown to customer)</label>
                    <input
                      value={discountNote}
                      onChange={e => setDiscountNote(e.target.value)}
                      placeholder="e.g. Loyalty discount"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 mt-0.5"
                    />
                  </div>
                </div>

                {/* Tax override */}
                <div className="mb-2">
                  <label className="text-xs text-gray-500">
                    Tax Rate (%) — auto: {autoTaxRate(selected.city)}% for {selected.city || 'unknown city'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={taxOverride}
                    onChange={e => setTaxOverride(e.target.value)}
                    placeholder={`${autoTaxRate(selected.city)} (auto)`}
                    className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 mt-0.5"
                  />
                </div>

                {/* Quote notes */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500">Notes / Message to Customer</label>
                  <textarea
                    value={quoteNotes}
                    onChange={e => setQuoteNotes(e.target.value)}
                    rows={2}
                    placeholder="Optional message shown on the quote..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 mt-0.5 resize-none"
                  />
                </div>

                {/* Totals summary */}
                {lineItems.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1 mb-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmt > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount</span><span>-${discountAmt.toFixed(2)}</span>
                      </div>
                    )}
                    {taxRate > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Tax ({taxRate}%)</span><span>${taxAmt.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                      <span>Total</span><span className="text-green-600">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleSaveQuote}
                    disabled={isPending || lineItems.length === 0}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                  >
                    Save Quote
                  </button>
                  <button
                    onClick={handleSendQuote}
                    disabled={isPending || lineItems.length === 0 || !selected.email}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                  >
                    {selected.quoteSentAt ? 'Resend Quote' : 'Send Quote to Customer'}
                  </button>
                  {selected.quoteToken && (
                    <>
                      <a
                        href={`/quote/${selected.quoteToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Preview Quote
                      </a>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/quote/${selected.quoteToken}`
                          navigator.clipboard.writeText(url)
                          showToast('Quote link copied!')
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Copy Link
                      </button>
                    </>
                  )}
                </div>

                {/* Quote status */}
                {selected.quoteSentAt && (() => {
                  const expired = !selected.quoteResponse && isQuoteExpired(selected.quoteSentAt)
                  return (
                    <div className="mt-2 text-xs space-y-0.5">
                      <p className="text-gray-400">Sent: {new Date(selected.quoteSentAt).toLocaleString()}</p>
                      {expired && (
                        <p className="text-red-500 font-semibold">⚠️ Quote expired (30 days) — resend to renew</p>
                      )}
                      {!expired && selected.quoteViewedAt && <p className="text-blue-600">Viewed: {new Date(selected.quoteViewedAt).toLocaleString()}</p>}
                      {!expired && !selected.quoteViewedAt && !selected.quoteResponse && <p className="text-orange-500">Not yet viewed</p>}
                      {selected.quoteResponse && (
                        <p className={selected.quoteResponse === 'accepted' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                          {selected.quoteResponse === 'accepted' ? 'Accepted' : 'Declined'}
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Payment */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">PAYMENT</p>
                {selected.isPaid ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                        Paid — {selected.paymentMethod} {selected.paidAt ? `on ${new Date(selected.paidAt).toLocaleDateString()}` : ''}
                      </span>
                      <button
                        onClick={handleMarkUnpaid}
                        disabled={isPending}
                        className="text-xs text-gray-400 hover:text-red-500 underline"
                      >
                        Mark Unpaid
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          startTransition(async () => {
                            const token = await sendReceipt(selected.id)
                            setReceiptToken(token)
                            showToast(selected.email ? 'Receipt sent!' : 'Receipt link generated!')
                          })
                        }}
                        disabled={isPending}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                      >
                        {selected.receiptSentAt ? 'Resend Receipt' : 'Send Receipt'}
                      </button>
                      {(receiptToken ?? selected.receiptToken) && (
                        <a
                          href={`/receipt/${receiptToken ?? selected.receiptToken}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold transition-colors"
                        >
                          View Receipt
                        </a>
                      )}
                    </div>
                    {selected.receiptSentAt && (
                      <p className="text-xs text-gray-400">Receipt sent {new Date(selected.receiptSentAt).toLocaleString()}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Payment link for completed jobs */}
                    {selected.status === 'completed' && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-semibold text-blue-700">PAYMENT REQUEST</p>
                        {(paymentLink ?? selected.squarePaymentUrl) ? (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(paymentLink ?? selected.squarePaymentUrl ?? '')
                                showToast('Payment link copied!')
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                            >
                              Copy Payment Link
                            </button>
                            <a href={paymentLink ?? selected.squarePaymentUrl ?? ''} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold">
                              Preview
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              startTransition(async () => {
                                const url = await sendPaymentRequest(selected.id)
                                setPaymentLink(url)
                                showToast('Payment request sent!')
                              })
                            }}
                            disabled={isPending}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                          >
                            Send Payment Request
                          </button>
                        )}
                        <p className="text-xs text-blue-500">Email sent automatically when job is marked complete. Copy link to text them.</p>
                      </div>
                    )}

                    {/* Square tap-to-pay button */}
                    <SquareChargeLink selected={selected} />
                    <p className="text-xs text-gray-400 text-center">Opens Square app on your iPhone — tap card, done. Then mark paid below.</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white"
                      >
                        <option value="cash">Cash</option>
                        <option value="check">Check</option>
                        <option value="card">Card</option>
                        <option value="venmo">Venmo</option>
                        <option value="zelle">Zelle</option>
                        <option value="paypal">PayPal</option>
                        <option value="other">Other</option>
                      </select>
                      <button
                        onClick={handleMarkPaid}
                        disabled={isPending}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                      >
                        Mark as Paid — ${(selected.grandTotal ?? selected.quoteAmount ?? 0).toFixed(2)}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Expenses */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">EXPENSES / PARTS COST (for your records)</p>
                <div className="flex gap-2 items-end flex-wrap">
                  <div>
                    <label className="text-xs text-gray-400">Cost ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={expenseCost}
                      onChange={e => setExpenseCost(e.target.value)}
                      placeholder="0.00"
                      className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 block mt-0.5"
                    />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs text-gray-400">Notes</label>
                    <input
                      value={expenseNotes}
                      onChange={e => setExpenseNotes(e.target.value)}
                      placeholder="Parts, supplies..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 block mt-0.5"
                    />
                  </div>
                  <button
                    onClick={handleSaveExpenses}
                    disabled={isPending}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
                {selected.expenseCost != null && (
                  <div className="mt-1 text-xs text-gray-500">
                    Saved: ${selected.expenseCost.toFixed(2)}{selected.expenseNotes ? ` — ${selected.expenseNotes}` : ''}
                    {selected.grandTotal && (
                      <span className="ml-2 text-green-600 font-medium">
                        Profit: ${(selected.grandTotal - selected.expenseCost).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New manual job modal */}
      {showManual && (() => {
        const matchingCustomers = customerSearch.length > 0
          ? customers.filter(c =>
              c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
              (c.phone ?? '').includes(customerSearch) ||
              (c.email ?? '').toLowerCase().includes(customerSearch.toLowerCase())
            ).slice(0, 6)
          : []

        return (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) { setShowManual(false); setSelectedCustomer(null); setCustomerSearch('') } }}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="font-bold text-gray-900">New Job</p>
                <button onClick={() => { setShowManual(false); setSelectedCustomer(null); setCustomerSearch('') }} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
              </div>
              <form
                action={async (fd: FormData) => {
                  if (selectedCustomer) fd.set('customerId', selectedCustomer.id)
                  await createManualJob(fd)
                  setShowManual(false)
                  setSelectedCustomer(null)
                  setCustomerSearch('')
                  window.location.reload()
                }}
                className="px-6 py-4 space-y-3"
              >
                {/* Customer search */}
                <div className="relative" ref={dropdownRef}>
                  <label className="text-xs text-gray-500">Search Existing Customer</label>
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between mt-0.5 border border-green-400 bg-green-50 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{selectedCustomer.name}</p>
                        <p className="text-xs text-gray-500">{selectedCustomer.phone} {selectedCustomer.email ? `· ${selectedCustomer.email}` : ''}</p>
                      </div>
                      <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }} className="text-gray-400 hover:text-red-500 text-sm ml-2">×</button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={e => { setCustomerSearch(e.target.value); setShowDropdown(true) }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Type name, phone, or email..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-0.5 outline-none focus:border-gray-400"
                      />
                      {showDropdown && matchingCustomers.length > 0 && (
                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                          {matchingCustomers.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setShowDropdown(false) }}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                            >
                              <p className="text-sm font-medium text-gray-900">{c.name}</p>
                              <p className="text-xs text-gray-400">{c.phone} {c.email ? `· ${c.email}` : ''}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Or leave blank to create a new customer below.</p>
                </div>

                <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Customer Name *</label>
                    <input name="name" required defaultValue={selectedCustomer?.name ?? ''} key={selectedCustomer?.id + '-name'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-0.5 outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Phone</label>
                    <input name="phone" defaultValue={selectedCustomer?.phone ?? ''} key={selectedCustomer?.id + '-phone'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-0.5 outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <input name="email" type="email" defaultValue={selectedCustomer?.email ?? ''} key={selectedCustomer?.id + '-email'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-0.5 outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">City</label>
                    <input name="city" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-0.5 outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Equipment Type</label>
                    <input name="equipmentType" placeholder="Lawn mower, chainsaw..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-0.5 outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Make / Brand</label>
                    <input name="equipmentMake" placeholder="Husqvarna, Echo..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-0.5 outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Date</label>
                    <input name="preferredDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-0.5 outline-none focus:border-gray-400" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Issue / Notes</label>
                    <textarea name="issues" rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-0.5 outline-none focus:border-gray-400 resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition-colors">
                  Create Job
                </button>
              </form>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function SquareChargeLink({ selected }: { selected: Booking }) {
  const amount = selected.grandTotal ?? selected.quoteAmount ?? 0
  const amountCents = Math.round(amount * 100)
  const data = JSON.stringify({
    amount_money: { amount: amountCents, currency_code: 'USD' },
    callback_url: 'https://www.ellismobilerepair.com/admin/jobs',
    client_id: 'sq0idp-DhkCsL0SXRUm7ci0ovToxA',
    version: '1.3',
    notes: `${selected.name} - ${selected.equipmentType}`,
  })
  const url = `square-commerce-v1://payment/create?data=${encodeURIComponent(data)}`
  return (
    <a href={url} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
      ⚡ Charge ${amount.toFixed(2)} with Square
    </a>
  )
}

function isQuoteExpired(sentAt: Date | null): boolean {
  if (!sentAt) return false
  const days = (Date.now() - new Date(sentAt).getTime()) / (1000 * 60 * 60 * 24)
  return days > 30
}

function autoTaxRate(city: string): number {
  const c = (city ?? '').toLowerCase()
  if (c.includes('council bluffs') || c.includes(', ia') || c.includes('iowa')) return 6.0
  if (c.includes('omaha') || c.includes(', ne') || c.includes('nebraska')) return 5.5
  return 0
}
