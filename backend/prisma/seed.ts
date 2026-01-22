import * as dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'  
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { resolve } from 'path'

// Load .env from backend directory
dotenv.config({ path: resolve(__dirname, '../.env') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file')
  console.error('📝 Please copy backend/.env.example to backend/.env and fill in your database URL')
  console.error('   Example: DATABASE_URL="postgresql://user:password@localhost:5432/dbname"')
  process.exit(1)
}

const prisma = new PrismaClient() 

async function main() {
  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: 'admin',
      deletedAt: null,
    },
  })

  if (existingAdmin) {
    console.log('⚠️  Admin already exists. Skipping seed.')
    console.log(`   Existing admin: ${existingAdmin.email}`)
    return
  }

  const hashedPassword = await bcrypt.hash('admin1234', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'ashenafizewdie919@gmail.com' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: 'ashenafizewdie919@gmail.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'admin', 
      isActive: true,
    },
  })

  console.log('✅ Admin created via seed!')
  console.log('📧 Email: ashenafizewdie919@gmail.com')
  console.log('🔑 Password: admin1234')
  console.log('')
  console.log('💡 You can also create admin via API: POST /auth/bootstrap')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
