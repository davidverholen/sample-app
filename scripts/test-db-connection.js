#!/usr/bin/env node
/**
 * Simple script to test database connectivity
 * Usage: node scripts/test-db-connection.js
 * Exits with code 0 if connection succeeds, 1 if it fails
 */

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
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
}

testConnection()
