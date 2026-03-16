import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'

// POST /api/v1/admin/applications/[id]/config/database/studio/sql
// Runs a raw (read-only) SQL query against the configured database.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const { database, sql } = await request.json()
  if (!database || !sql?.trim()) return NextResponse.json({ error: 'Missing database config or SQL' }, { status: 400 })

  const connStr = database.connectionString || buildConnectionString(database)
  if (!connStr) return NextResponse.json({ error: 'Missing connection details' }, { status: 400 })

  try {
    if (database.type === 'postgresql') {
      const { Client } = await import('pg').catch(() => { throw new Error('pg package not installed') })
      const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 8000, ssl: database.ssl ? { rejectUnauthorized: false } : false })
      await client.connect()
      const res = await client.query(sql)
      await client.end()
      return NextResponse.json({ rows: res.rows, rowCount: res.rowCount, command: res.command })
    }

    if (database.type === 'mysql') {
      const mysql = await import('mysql2/promise').catch(() => { throw new Error('mysql2 package not installed') })
      const conn = await mysql.createConnection({ uri: connStr, connectTimeout: 8000 })
      const [rows] = await conn.query(sql)
      await conn.end()
      return NextResponse.json({ rows: Array.isArray(rows) ? rows : [], rowCount: Array.isArray(rows) ? rows.length : 0 })
    }

    if (database.type === 'mongodb') {
      return NextResponse.json({ error: 'Use the table browser for MongoDB — raw SQL is not supported' }, { status: 400 })
    }

    return NextResponse.json({ error: `SQL not supported for type: ${database.type}` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Query failed' }, { status: 500 })
  }
}

function buildConnectionString(db: any): string {
  if (!db.host) return ''
  const user = db.username ? encodeURIComponent(db.username) : ''
  const pass = db.password ? `:${encodeURIComponent(db.password)}` : ''
  const auth = user ? `${user}${pass}@` : ''
  const port = db.port ? `:${db.port}` : ''
  const dbName = db.database ? `/${db.database}` : ''
  const proto = db.type === 'mysql' ? 'mysql' : 'postgresql'
  return `${proto}://${auth}${db.host}${port}${dbName}`
}
