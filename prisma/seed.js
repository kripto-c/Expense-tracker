const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const bcrypt = require('bcrypt')
require('dotenv').config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL not set in .env')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Crear roles con permisos en el formato { actions, subject }
  const superadminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {},
    create: {
      name: 'superadmin',
      description: 'Acceso total',
      permissions: [{ actions: ['manage'], subject: ['all'] }],
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrador',
      permissions: [
        { actions: ['create', 'read', 'update', 'delete'], subject: ['groups'] },
        { actions: ['create', 'read', 'update', 'delete'], subject: ['expenses'] },
        { actions: ['read', 'update'], subject: ['users'] },
      ],
    },
  })

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Usuario regular',
      permissions: [
        { actions: ['create', 'read'], subject: ['groups'] },
        { actions: ['create', 'read'], subject: ['expenses'] },
      ],
    },
  })

  // Crear usuario superadmin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const superUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Super Admin',
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superUser.id, roleId: superadminRole.id } },
    update: {},
    create: { userId: superUser.id, roleId: superadminRole.id },
  })

  // Crear usuarios normales (opcional)
  const users = []
  for (const email of ['alice@example.com', 'bob@example.com']) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: await bcrypt.hash('password123', 10),
        name: email.split('@')[0],
      },
    })
    users.push(user)
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: userRole.id } },
      update: {},
      create: { userId: user.id, roleId: userRole.id },
    })
  }

  console.log('✅ Seed completado')
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())
