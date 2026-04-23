import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashed = await bcrypt.hash('admin123!', 12)
  await prisma.admin.upsert({
    where: { email: 'bellis@ellismobilerepair.com' },
    update: {},
    create: { email: 'bellis@ellismobilerepair.com', password: hashed },
  })
  console.log('Seeded admin: bellis@ellismobilerepair.com / admin123!')
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1) })
