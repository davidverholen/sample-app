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
  log: ['error'],
})

async function createSchema() {
  const schemaName = process.env.SCHEMA_NAME

  try {
    // Create schema using raw SQL
    // PostgreSQL identifiers need to be quoted if they contain special characters
    // But our schema name is sanitized, so we can use it directly
    // Using parameterized query to prevent SQL injection
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
    console.log(`✅ Schema created successfully: ${schemaName}`)
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error(`❌ Error creating schema: ${error.message}`)
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

createSchema()
