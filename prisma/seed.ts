import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Use environment variables for seed data
  const email = process.env.SEED_USER_EMAIL
  const password = process.env.SEED_USER_PASSWORD
  const name = process.env.SEED_USER_NAME

  // Only seed if environment variables are provided
  if (!email || !password) {
    console.log('Skipping user seed: SEED_USER_EMAIL and SEED_USER_PASSWORD not set')
    return
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log(`User ${email} already exists. Updating password...`)
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, ...(name && { name }) },
    })
    console.log(`Password updated for ${email}`)
  } else {
    console.log(`Creating user ${email}...`)
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        name: name || 'Test User',
        password: hashedPassword,
      },
    })
    console.log(`User created: ${user.email}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

