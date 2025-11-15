#!/usr/bin/env node
/**
 * Script to create a PostgreSQL schema for preview deployments
 * Usage: node scripts/create-schema.js
 * Requires: SCHEMA_NAME and DATABASE_URL environment variables
 * Exits with code 0 if schema creation succeeds, 1 if it fails
 */

// Validate SCHEMA_NAME is set
if (!process.env.SCHEMA_NAME) {
  console.error('❌ Error: SCHEMA_NAME environment variable is not set')
  console.error('Please set SCHEMA_NAME before running this script')
  process.exit(1)
}

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set')
  console.error('Please set DATABASE_URL before running this script')
  process.exit(1)
}

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

async function createSchema() {
  const schemaName = process.env.SCHEMA_NAME
  const databaseUrl = process.env.DATABASE_URL

  // Validate inputs
  if (!schemaName) {
    console.error('❌ Error: SCHEMA_NAME environment variable is not set')
    process.exit(1)
  }

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  // Log connection info (without password)
  const safeUrl = databaseUrl.replace(/:[^:@]+@/, ':***@')
  console.log(`🔍 Connecting to database: ${safeUrl}`)
  console.log(`📦 Creating schema: ${schemaName}`)

  try {
    // Skip explicit $connect() - Prisma will connect lazily on first query
    // This avoids issues with Transaction Mode (port 6543) where $connect() may fail
    // but the actual query execution works fine
    // Create schema using raw SQL
    // PostgreSQL identifiers need to be quoted if they contain special characters
    // But our schema name is sanitized, so we can use it directly
    // Using parameterized query to prevent SQL injection
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
    console.log(`✅ Schema created successfully: ${schemaName}`)

    // Verify schema was created
    const schemas = await prisma.$queryRawUnsafe(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      schemaName
    )

    if (Array.isArray(schemas) && schemas.length > 0) {
      console.log(`✅ Schema verified: ${schemaName} exists`)
    }

    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error(`❌ Error creating schema: ${error.message}`)

    if (error.code) {
      console.error(`   Error code: ${error.code}`)
    }

    if (error.meta) {
      console.error(`   Error details:`, JSON.stringify(error.meta, null, 2))
    }

    // Provide specific error guidance
    if (error.message.includes("Can't reach database server")) {
      console.error('')
      console.error('💡 This error typically indicates:')
      console.error('   1. Database host is incorrect or unreachable')
      console.error('   2. Network connectivity issues (firewall blocking)')
      console.error('   3. Database connection string format is incorrect')
      console.error('   4. Supabase project might not allow direct connections')
      console.error('')
      console.error('🔧 Troubleshooting:')
      console.error(
        '   - Verify DATABASE_URL format is correct (should include ?pgbouncer=true for Transaction Mode)'
      )
      console.error('   - Check if password needs URL encoding (special characters)')
      console.error('   - Verify database host is accessible from GitHub Actions')
      console.error('   - Check Supabase project settings for connection restrictions')
      console.error(
        '   - Ensure connection string includes: ?sslmode=require&pgbouncer=true&connection_limit=1&connect_timeout=30'
      )
    } else if (error.message.includes('authentication') || error.message.includes('password')) {
      console.error('')
      console.error('💡 This error typically indicates:')
      console.error('   1. Database password is incorrect')
      console.error('   2. Password contains special characters that need URL encoding')
      console.error('   3. Database user does not have required permissions')
      console.error('')
      console.error('🔧 Troubleshooting:')
      console.error('   - Verify SUPABASE_DB_PASSWORD is correct')
      console.error('   - Ensure password is URL-encoded if it contains special characters')
      console.error('   - Check database user permissions in Supabase dashboard')
    }

    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
}

createSchema()
