'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Customer, Equipment, ServiceRecord } from '@/app/generated/prisma/client'
import { updateCustomer, createEquipment, updateEquipment, deleteEquipment, createServiceRecord, deleteServiceRecord } from '@/app/actions/customers'

type EquipmentWithRecords = Equipment & { serviceRecords: ServiceRecord[] }
type CustomerWithEquipment = Customer & { equipment: EquipmentWithRecords[] }

const CHECKLIST_ITEMS = [
  'Check oil level',
  'Change oil',
  'Replace spark plug',
  'Clean/replace air filter',
  'Sharpen blade',
  'Replace blade',
  'Check blade balance',
  'Clean mower deck',
  'Check/replace fuel filter',
  'Clean carburetor',
  'Replace carburetor',
  'Check/replace belt',
  'Check tire pressure',
  'Test start',
  'Full inspection',
]

const SERVICES = [
  'Full Tune-Up', 'Oil Change', 'Blade Sharpening', 'Spark Plug Replacement',
  'Carburetor Cleaning', 'Belt Replacement', 'Air Filter Replacement', 'Diagnostics & Minor Repair',
]

const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400'

export function CustomerDetail({ customer }: { customer: CustomerWithEquipment }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editingCustomer, setEditingCustomer] = useState(false)
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithRecords | null>(
    customer.equipment[0] ?? null
  )
  const [showAddService, setShowAddService] = useState(false)

  // Customer edit form state
  const [cName, setCName] = useState(customer.name)
  const [cPhone, setCPhone] = useState(customer.phone ?? '')
  const [cEmail, setCEmail] = useState(customer.email ?? '')
  const [cAddress, setCAddress] = useState(customer.address ?? '')
  const [cCity, setCCity] = useState(customer.city ?? '')
  const [cNotes, setCNotes] = useState(customer.notes ?? '')

  // Equipment edit state
  const [eType, setEType] = useState('')
  const [eMake, setEMake] = useState('')
  const [eModel, setEModel] = useState('')
  const [eSerial, setESerial] = useState('')
  const [eHours, setEHours] = useState('')
  const [eNotes, setENotes] = useState('')

  function saveCustomer() {
    startTransition(async () => {
      await updateCustomer(customer.id, { name: cName, email: cEmail, phone: cPhone, address: cAddress, city: cCity, notes: cNotes })
      router.refresh()
      setEditingCustomer(false)
    })
  }

  function handleAddEquipment(formData: FormData) {
    startTransition(async () => {
      await createEquipment(customer.id, formData)
      router.refresh()
      setShowAddEquipment(false)
    })
  }

  function startEditEquipment(eq: Equipment) {
    setEType(eq.type)
    setEMake(eq.make ?? '')
    setEModel(eq.model ?? '')
    setESerial(eq.serialNumber ?? '')
    setEHours(eq.engineHours != null ? String(eq.engineHours) : '')
    setENotes(eq.notes ?? '')
    setEditingEquipment(eq.id)
  }

  function saveEquipment() {
    if (!editingEquipment) return
    startTransition(async () => {
      await updateEquipment(editingEquipment, customer.id, { type: eType, make: eMake, model: eModel, serialNumber: eSerial, engineHours: eHours, notes: eNotes })
      router.refresh()
      setEditingEquipment(null)
    })
  }

  function handleDeleteEquipment(id: string, name: string) {
    if (!confirm(`Delete ${name} and all its service history?`)) return
    startTransition(async () => {
      await deleteEquipment(id, customer.id)
      router.refresh()
      setSelectedEquipment(null)
    })
  }

  function handleAddService(formData: FormData) {
    if (!selectedEquipment) return
    startTransition(async () => {
      await createServiceRecord(selectedEquipment.id, customer.id, formData)
      router.refresh()
      setShowAddService(false)
    })
  }

  function handleDeleteService(id: string) {
    if (!confirm('Delete this service record?')) return
    startTransition(async () => {
      await deleteServiceRecord(id, customer.id)
      router.refresh()
    })
  }

  function partsLookupUrl(eq: Equipment) {
    const q = [eq.make, eq.model].filter(Boolean).join(' ')
    return `https://www.jackssmallengines.com/jacks-parts-lookup/?query=${encodeURIComponent(q)}`
  }

  const equip = customer.equipment.find(e => e.id === selectedEquipment?.id) ?? selectedEquipment

  return (
    <div className="space-y-5">
      {/* Customer Info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
            <p className="text-sm text-gray-500">{customer.phone}{customer.city ? ` · ${customer.city}` : ''}</p>
            {customer.email && <p className="text-sm text-gray-400">{customer.email}</p>}
            {customer.address && <p className="text-sm text-gray-400">{customer.address}</p>}
            {customer.notes && <p className="text-sm text-gray-500 italic mt-1">"{customer.notes}"</p>}
          </div>
          <button onClick={() => setEditingCustomer(!editingCustomer)} className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
            {editingCustomer ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingCustomer && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input value={cName} onChange={e => setCName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input value={cPhone} onChange={e => setCPhone(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input value={cEmail} onChange={e => setCEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                <input value={cCity} onChange={e => setCCity(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <input value={cAddress} onChange={e => setCAddress(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={cNotes} onChange={e => setCNotes(e.target.value)} rows={2} className={inputCls + ' resize-none'} />
            </div>
            <button onClick={saveCustomer} className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold">Save</button>
          </div>
        )}
      </div>

      {/* Equipment */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Equipment</h3>
          <button onClick={() => setShowAddEquipment(true)} className="text-xs font-medium text-green-600 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50">
            + Add Mower
          </button>
        </div>

        {customer.equipment.length === 0 ? (
          <p className="text-sm text-gray-400">No equipment added yet.</p>
        ) : (
          <div className="space-y-2">
            {customer.equipment.map(eq => (
              <div
                key={eq.id}
                onClick={() => setSelectedEquipment(eq)}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${selectedEquipment?.id === eq.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{eq.type}{eq.make ? ` — ${eq.make}` : ''}{eq.model ? ` ${eq.model}` : ''}</p>
                    <p className="text-xs text-gray-400">
                      {eq.serialNumber ? `S/N: ${eq.serialNumber}` : 'No serial'}{eq.engineHours != null ? ` · ${eq.engineHours} hrs` : ''}
                    </p>
                    <p className="text-xs text-gray-400">{eq.serviceRecords.length} service{eq.serviceRecords.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {(eq.make || eq.model) && (
                      <a href={partsLookupUrl(eq)} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-lg px-2 py-1">
                        Parts
                      </a>
                    )}
                    <button onClick={() => startEditEquipment(eq)} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2 py-1">Edit</button>
                    <button onClick={() => handleDeleteEquipment(eq.id, `${eq.make ?? ''} ${eq.model ?? eq.type}`)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Equipment Modal */}
      {editingEquipment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Edit Equipment</h3>
              <button onClick={() => setEditingEquipment(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select value={eType} onChange={e => setEType(e.target.value)} className={inputCls}>
                  <option>Push Mower</option>
                  <option>Self-Propelled Mower</option>
                  <option>Riding Mower</option>
                  <option>Zero-Turn Mower</option>
                  <option>Tractor</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Make</label>
                  <input value={eMake} onChange={e => setEMake(e.target.value)} placeholder="Honda" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
                  <input value={eModel} onChange={e => setEModel(e.target.value)} placeholder="HRX217" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Serial Number</label>
                  <input value={eSerial} onChange={e => setESerial(e.target.value)} placeholder="XXXX-XXXXXX" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Engine Hours</label>
                  <input type="number" value={eHours} onChange={e => setEHours(e.target.value)} placeholder="0" min="0" step="0.1" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={eNotes} onChange={e => setENotes(e.target.value)} rows={2} className={inputCls + ' resize-none'} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingEquipment(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={saveEquipment} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddEquipment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Add Equipment</h3>
              <button onClick={() => setShowAddEquipment(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form action={handleAddEquipment} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                <select name="type" required className={inputCls}>
                  <option value="">Select...</option>
                  <option>Push Mower</option>
                  <option>Self-Propelled Mower</option>
                  <option>Riding Mower</option>
                  <option>Zero-Turn Mower</option>
                  <option>Tractor</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Make</label>
                  <input name="make" placeholder="Honda, Husqvarna..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
                  <input name="model" placeholder="HRX217, LC221A..." className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Serial Number</label>
                  <input name="serialNumber" placeholder="XXXX-XXXXXX" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Engine Hours</label>
                  <input name="engineHours" type="number" placeholder="0" min="0" step="0.1" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea name="notes" rows={2} className={inputCls + ' resize-none'} placeholder="Any notes about this equipment..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddEquipment(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service History */}
      {equip && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Service History</h3>
              <p className="text-xs text-gray-400">{equip.type}{equip.make ? ` — ${equip.make}` : ''}{equip.model ? ` ${equip.model}` : ''}</p>
            </div>
            <button
              onClick={() => setShowAddService(true)}
              className="text-xs font-medium text-green-600 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50"
            >
              + Add Service
            </button>
          </div>

          {equip.serviceRecords.length === 0 ? (
            <p className="text-sm text-gray-400">No service records yet.</p>
          ) : (
            <div className="space-y-3">
              {equip.serviceRecords.map(rec => {
                const checklist = rec.checklist as Record<string, boolean> | null
                const completed = checklist ? Object.entries(checklist).filter(([, v]) => v).map(([k]) => k) : []
                return (
                  <div key={rec.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{rec.date}</p>
                        {rec.engineHours != null && <p className="text-xs text-gray-400">{rec.engineHours} engine hrs</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        {rec.price != null && <span className="text-sm font-bold text-green-600">${Number(rec.price).toFixed(2)}</span>}
                        <button onClick={() => handleDeleteService(rec.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </div>
                    {rec.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {rec.services.map(s => (
                          <span key={s} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">{s}</span>
                        ))}
                      </div>
                    )}
                    {completed.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {completed.map(item => (
                          <span key={item} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">✓ {item}</span>
                        ))}
                      </div>
                    )}
                    {rec.partsUsed && <p className="text-xs text-gray-500">Parts: {rec.partsUsed}</p>}
                    {rec.notes && <p className="text-xs text-gray-500 italic mt-1">"{rec.notes}"</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Service Modal */}
      {showAddService && equip && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h3 className="font-semibold text-gray-900">Add Service Record</h3>
                <p className="text-xs text-gray-400">{equip.type}{equip.make ? ` — ${equip.make}` : ''}{equip.model ? ` ${equip.model}` : ''}</p>
              </div>
              <button onClick={() => setShowAddService(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form action={handleAddService} className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                  <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Engine Hours</label>
                  <input name="engineHours" type="number" placeholder="0" min="0" step="0.1" defaultValue={equip.engineHours ?? ''} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Services Performed</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERVICES.map(s => (
                    <label key={s} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 text-sm text-gray-700">
                      <input type="checkbox" name="services" value={s} className="accent-green-600" />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Checklist</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHECKLIST_ITEMS.map(item => (
                    <label key={item} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 text-sm text-gray-700">
                      <input type="checkbox" name={`check_${item}`} className="accent-green-600" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parts Used</label>
                <input name="partsUsed" placeholder="e.g. Champion RJ19LM spark plug, SAE 30 oil..." className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea name="notes" rows={3} placeholder="Any notes about this service..." className={inputCls + ' resize-none'} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Labor Hours</label>
                  <input name="laborHours" type="number" min="0" step="0.25" placeholder="1.0" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Total Price ($)</label>
                  <input name="price" type="number" min="0" step="0.01" placeholder="75.00" className={inputCls} />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddService(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
