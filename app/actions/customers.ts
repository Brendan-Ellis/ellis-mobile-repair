'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import { randomBytes } from 'crypto'

function cuid() {
  return randomBytes(12).toString('hex')
}

// Customers
export async function createCustomer(formData: FormData) {
  await verifyAdmin()
  const id = cuid()
  await prisma.customer.create({
    data: {
      id,
      name: formData.get('name') as string,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      address: (formData.get('address') as string) || null,
      city: (formData.get('city') as string) || null,
      notes: (formData.get('notes') as string) || null,
    },
  })
  revalidatePath('/admin/customers')
}

export async function updateCustomer(customerId: string, data: {
  name: string; email: string; phone: string; address: string; city: string; notes: string
}) {
  await verifyAdmin()
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      notes: data.notes || null,
    },
  })
  revalidatePath(`/admin/customers/${customerId}`)
}

export async function deleteCustomer(customerId: string) {
  await verifyAdmin()
  await prisma.customer.delete({ where: { id: customerId } })
  revalidatePath('/admin/customers')
}

// Equipment
export async function createEquipment(customerId: string, formData: FormData) {
  await verifyAdmin()
  const id = cuid()
  await prisma.equipment.create({
    data: {
      id,
      customerId,
      type: formData.get('type') as string,
      make: (formData.get('make') as string) || null,
      model: (formData.get('model') as string) || null,
      serialNumber: (formData.get('serialNumber') as string) || null,
      engineHours: formData.get('engineHours') ? parseFloat(formData.get('engineHours') as string) : null,
      notes: (formData.get('notes') as string) || null,
    },
  })
  revalidatePath(`/admin/customers/${customerId}`)
}

export async function updateEquipment(equipmentId: string, customerId: string, data: {
  type: string; make: string; model: string; serialNumber: string; engineHours: string; notes: string
}) {
  await verifyAdmin()
  await prisma.equipment.update({
    where: { id: equipmentId },
    data: {
      type: data.type,
      make: data.make || null,
      model: data.model || null,
      serialNumber: data.serialNumber || null,
      engineHours: data.engineHours ? parseFloat(data.engineHours) : null,
      notes: data.notes || null,
    },
  })
  revalidatePath(`/admin/customers/${customerId}`)
}

export async function deleteEquipment(equipmentId: string, customerId: string) {
  await verifyAdmin()
  await prisma.equipment.delete({ where: { id: equipmentId } })
  revalidatePath(`/admin/customers/${customerId}`)
}

// Service Records
export async function createServiceRecord(equipmentId: string, customerId: string, formData: FormData) {
  await verifyAdmin()
  const id = cuid()
  const services = formData.getAll('services') as string[]
  const checklistKeys = [...formData.keys()].filter(k => k.startsWith('check_'))
  const checklist: Record<string, boolean> = {}
  for (const key of checklistKeys) {
    checklist[key.replace('check_', '')] = formData.get(key) === 'on'
  }
  await prisma.serviceRecord.create({
    data: {
      id,
      equipmentId,
      date: formData.get('date') as string,
      engineHours: formData.get('engineHours') ? parseFloat(formData.get('engineHours') as string) : null,
      services,
      checklist,
      partsUsed: (formData.get('partsUsed') as string) || null,
      notes: (formData.get('notes') as string) || null,
      laborHours: formData.get('laborHours') ? parseFloat(formData.get('laborHours') as string) : null,
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    },
  })
  // Update engine hours on equipment
  if (formData.get('engineHours')) {
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { engineHours: parseFloat(formData.get('engineHours') as string) },
    })
  }
  revalidatePath(`/admin/customers/${customerId}`)
}

export async function deleteServiceRecord(recordId: string, customerId: string) {
  await verifyAdmin()
  await prisma.serviceRecord.delete({ where: { id: recordId } })
  revalidatePath(`/admin/customers/${customerId}`)
}
