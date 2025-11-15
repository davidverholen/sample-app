#!/usr/bin/env node
/**
 * Simple script to test database connectivity
 * Usage: node scripts/test-db-connection.js
 * Exits with code 0 if connection succeeds, 1 if it fails
 */

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set')
  console.error('Please set DATABASE_URL before running this script')
  process.exit(1)
}

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['error'],
})

async function testConnection() {
  try {
    // Try a simple query to test connectivity
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful')
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    if (error.code) {
      console.error(`   Error code: ${error.code}`)
    }
    if (error.meta) {
      console.error(`   Error details:`, error.meta)
    }
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
}

testConnection()
