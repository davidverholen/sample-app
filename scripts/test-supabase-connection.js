#!/usr/bin/env node
/**
 * Test script to verify Supabase Transaction Mode connection
 * Usage: node scripts/test-supabase-connection.js <project-ref> <password>
 */

const projectRef = process.argv[2]
const password = process.argv[3]

if (!projectRef || !password) {
  console.error('Usage: node scripts/test-supabase-connection.js <project-ref> <password>')
  process.exit(1)
}

// URL encode password
const encodedPassword = encodeURIComponent(password)

// Construct connection string
const dbHost = `db.${projectRef}.supabase.co`
const databaseUrl = `postgres://postgres:${encodedPassword}@${dbHost}:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&connect_timeout=30`

console.log('🔍 Testing Supabase Transaction Mode connection...')
console.log(`   Host: ${dbHost}`)
console.log(`   Port: 6543`)
console.log(`   Protocol: postgres://`)
console.log(`   PgBouncer: true`)
console.log('')

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: ['error', 'warn', 'query'],
})

async function testConnection() {
  try {
    console.log('📡 Attempting connection...')

    // Test with $queryRawUnsafe (no prepared statements)
    const result = await prisma.$queryRawUnsafe(
      'SELECT 1 as test, current_database() as db, current_schema() as schema'
    )
    console.log('✅ Connection successful!')
    console.log('   Result:', result)

    // Test schema listing
    const schemas = await prisma.$queryRawUnsafe(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `)
    console.log('✅ Schema query successful!')
    console.log('   Available schemas:', schemas)

    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed!')
    console.error('   Error:', error.message)
    if (error.code) {
      console.error(`   Error code: ${error.code}`)
    }
    if (error.meta) {
      console.error(`   Error meta:`, JSON.stringify(error.meta, null, 2))
    }

    // Try alternative connection methods
    console.log('')
    console.log('🔄 Trying alternative connection test...')

    try {
      // Try with $connect() first
      await prisma.$connect()
      console.log('✅ $connect() succeeded')
      const result = await prisma.$queryRawUnsafe('SELECT 1 as test')
      console.log('✅ Query succeeded:', result)
      await prisma.$disconnect()
      process.exit(0)
    } catch (connectError) {
      console.error('❌ Alternative connection also failed:', connectError.message)
      await prisma.$disconnect().catch(() => {})
      process.exit(1)
    }
  }
}

testConnection()
