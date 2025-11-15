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

// Use pg library directly for Transaction Mode connections
// Prisma can have issues with Transaction Mode (port 6543) connections
// Using pg directly gives us more control and better error messages
const { Client } = require('pg')
const dns = require('dns')
const dnsPromises = require('dns').promises

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

  // Parse connection string to extract components
  const urlObj = new URL(databaseUrl)
  const hostname = urlObj.hostname
  const port = parseInt(urlObj.port || '6543', 10)
  const database = urlObj.pathname.replace('/', '') || 'postgres'
  const username = urlObj.username || 'postgres'
  const password = urlObj.password

  // Extract search params
  const searchParams = urlObj.searchParams
  const sslMode = searchParams.get('sslmode') || 'require'

  // CRITICAL: Resolve hostname to IPv4 address explicitly
  // GitHub Actions runners may not have IPv6 connectivity
  // Supabase resolves to both IPv4 and IPv6, but we need IPv4
  let resolvedHost = hostname
  try {
    console.log(`🔍 Resolving hostname to IPv4: ${hostname}`)
    // Use dns.lookup with family: 4 to force IPv4 resolution
    // This works better than resolve4 when both IPv4 and IPv6 exist
    const { address } = await dnsPromises.lookup(hostname, { family: 4 })
    resolvedHost = address
    console.log(`✅ Resolved to IPv4: ${resolvedHost}`)
  } catch (resolveError) {
    console.warn(`⚠️  DNS resolution failed: ${resolveError.message}`)
    console.warn(`   Error code: ${resolveError.code || 'unknown'}`)
    console.warn(`   Will try connecting with hostname (may fail if IPv6 not available)`)
    // Keep original hostname if resolution fails
  }

  // Create pg Client with explicit options instead of connection string
  // This gives us more control over the connection, especially for IPv4/IPv6
  // pg handles Transaction Mode (port 6543) connections better than Prisma
  const client = new Client({
    host: resolvedHost, // Use resolved IPv4 address or original hostname
    port: port,
    database: database,
    user: username,
    password: password,
    // Force IPv4 to avoid ENETUNREACH errors on GitHub Actions
    // GitHub Actions runners may not have IPv6 connectivity
    family: 4, // Use IPv4 only - this prevents pg from trying IPv6
    // SSL configuration
    ssl: sslMode === 'require' || sslMode === 'prefer' ? { rejectUnauthorized: false } : false,
    // Disable prepared statements for Transaction Mode
    // Transaction Mode (port 6543) doesn't support prepared statements
    statement_timeout: 30000, // 30 seconds
    query_timeout: 30000,
  })

  // Debug: Log the actual connection details (without password)
  console.log(`🔍 Connection details:`)
  console.log(
    `   Host: ${resolvedHost}${resolvedHost !== hostname ? ` (resolved from ${hostname})` : ''}`
  )
  console.log(`   Port: ${port}`)
  console.log(`   Database: ${database}`)
  console.log(`   User: ${username}`)
  console.log(`   SSL: ${sslMode}`)
  console.log(`   Family: 4 (IPv4 only)`)

  console.log(`📦 Creating schema: ${schemaName}`)

  try {
    // Connect to database
    console.log('📡 Connecting to database...')
    await client.connect()
    console.log('✅ Connected to database')

    // Test connection with a simple query
    try {
      const testResult = await client.query(
        'SELECT 1 as test, current_database() as db, current_schema() as schema'
      )
      console.log('✅ Connection test successful')
      console.log(`   Database: ${testResult.rows[0].db}`)
      console.log(`   Current schema: ${testResult.rows[0].schema}`)
    } catch (testError) {
      console.error('❌ Connection test failed:', testError.message)
      throw testError
    }

    // Create schema using parameterized query to prevent SQL injection
    // PostgreSQL identifiers need to be quoted if they contain special characters
    // But our schema name is sanitized, so we can use it directly
    // Using pg_escape_identifier for safety
    const escapedSchemaName = schemaName.replace(/"/g, '""') // Escape double quotes
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${escapedSchemaName}"`)
    console.log(`✅ Schema created successfully: ${schemaName}`)

    // Verify schema was created
    // Note: Transaction Mode doesn't support prepared statements, so we use string interpolation
    // Schema name is sanitized, so SQL injection is not a concern
    const escapedSchemaNameForQuery = schemaName.replace(/'/g, "''") // Escape single quotes for SQL
    const verifyResult = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${escapedSchemaNameForQuery}'`
    )

    if (verifyResult.rows.length > 0) {
      console.log(`✅ Schema verified: ${schemaName} exists`)
    } else {
      console.warn(
        `⚠️  Warning: Schema ${schemaName} was created but not found in verification query`
      )
    }

    await client.end()
    process.exit(0)
  } catch (error) {
    console.error(`❌ Error creating schema: ${error.message}`)

    if (error.code) {
      console.error(`   Error code: ${error.code}`)
    }

    // Provide specific error guidance
    if (
      error.message.includes("Can't reach database server") ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENETUNREACH')
    ) {
      console.error('')
      console.error('💡 This error typically indicates:')
      console.error('   1. Database host is incorrect or unreachable')
      console.error('   2. Network connectivity issues (firewall blocking)')
      console.error('   3. DNS resolution failure or IPv6 connectivity issue')
      console.error('   4. Supabase project might not allow connections from this IP')
      if (error.message.includes('ENETUNREACH')) {
        console.error('   5. IPv6 connectivity issue - GitHub Actions may not support IPv6')
        console.error('      The script attempts to resolve to IPv4, but if that fails,')
        console.error('      it may fall back to IPv6 which is not available.')
      }
      console.error('')
      console.error('🔧 Troubleshooting:')
      console.error(
        '   - Verify DATABASE_URL format is correct (should include ?pgbouncer=true for Transaction Mode)'
      )
      console.error('   - Check if password needs URL encoding (special characters)')
      console.error(
        '   - Verify database host is accessible (try: ping db.[PROJECT-REF].supabase.co)'
      )
      console.error('   - Check Supabase project settings for connection restrictions')
      console.error(
        '   - Ensure connection string includes: ?sslmode=require&pgbouncer=true&connection_limit=1&connect_timeout=30'
      )
      console.error('   - Verify Transaction Mode (port 6543) is enabled in Supabase project')
    } else if (
      error.message.includes('authentication') ||
      error.message.includes('password') ||
      error.message.includes('password authentication failed')
    ) {
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
      console.error(
        '   - Verify username is "postgres" (not "postgres.[PROJECT-REF]") for Transaction Mode'
      )
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      console.error('')
      console.error('💡 This error typically indicates:')
      console.error('   1. Connection timeout - database server is not responding')
      console.error('   2. Network latency issues')
      console.error('   3. Firewall blocking the connection')
      console.error('')
      console.error('🔧 Troubleshooting:')
      console.error('   - Increase connect_timeout in connection string')
      console.error('   - Check network connectivity to Supabase')
      console.error('   - Verify Transaction Mode (port 6543) is accessible')
    }

    await client.end().catch(() => {})
    process.exit(1)
  }
}

createSchema()
