import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'

// POST /api/v1/admin/applications/[id]/config/database/test
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const body = await request.json()
  const { database } = body

  if (!database) return NextResponse.json({ ok: false, message: 'No database config provided' }, { status: 400 })

  const connStr = database.connectionString || buildConnectionString(database)
  if (!connStr) return NextResponse.json({ ok: false, message: 'Missing connection string or host/port details' }, { status: 400 })

  try {
    if (database.type === 'postgresql') {
      const { Client } = await import('pg').catch(() => { throw new Error('pg package not installed') })
      const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 5000, ssl: database.ssl ? { rejectUnauthorized: false } : false })
      await client.connect()
      await client.query('SELECT 1')
      await client.end()
      return NextResponse.json({ ok: true, message: 'PostgreSQL connection successful' })
    }

    if (database.type === 'mysql') {
      const mysql = await import('mysql2/promise').catch(() => { throw new Error('mysql2 package not installed') })
      const conn = await mysql.createConnection({ uri: connStr, connectTimeout: 5000, ssl: database.ssl ? {} : undefined })
      await conn.query('SELECT 1')
      await conn.end()
      return NextResponse.json({ ok: true, message: 'MySQL connection successful' })
    }

    if (database.type === 'mongodb') {
      const { MongoClient } = await import('mongodb').catch(() => { throw new Error('mongodb package not installed') })
      const client = new MongoClient(connStr, { connectTimeoutMS: 5000, serverSelectionTimeoutMS: 5000 })
      await client.connect()
      await client.db().command({ ping: 1 })
      await client.close()
      return NextResponse.json({ ok: true, message: 'MongoDB connection successful' })
    }

    return NextResponse.json({ ok: false, message: `Connection test not supported for type: ${database.type}` }, { status: 400 })
  } catch (error: any) {
    const msg = error.message || 'Connection failed'
    if (msg.includes('not installed')) {
      return NextResponse.json({ ok: false, message: `Driver not available: ${msg}` }, { status: 400 })
    }
    return NextResponse.json({ ok: false, message: msg })
  }
}

function buildConnectionString(db: any): string {
  if (!db.host) return ''
  const user = db.username ? encodeURIComponent(db.username) : ''
  const pass = db.password ? `:${encodeURIComponent(db.password)}` : ''
  const auth = user ? `${user}${pass}@` : ''
  const port = db.port ? `:${db.port}` : ''
  const dbName = db.database ? `/${db.database}` : ''
  const proto = db.type === 'mysql' ? 'mysql' : db.type === 'mongodb' ? 'mongodb' : 'postgresql'
  return `${proto}://${auth}${db.host}${port}${dbName}`
}
