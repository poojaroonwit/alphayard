import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'

// POST /api/v1/admin/applications/[id]/config/database/studio/query
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const { database, table, limit = 50, offset = 0, sortCol, sortDir = 'asc' } = await request.json()
  if (!database || !table) return NextResponse.json({ error: 'Missing database config or table name' }, { status: 400 })

  // Sanitize table name and sort column to prevent injection
  if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(table)) {
    return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
  }
  if (sortCol && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sortCol)) {
    return NextResponse.json({ error: 'Invalid sort column' }, { status: 400 })
  }

  const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 500)
  const safeOffset = Math.max(0, Number(offset) || 0)
  const safeDir = sortDir === 'desc' ? 'DESC' : 'ASC'
  const connStr = database.connectionString || buildConnectionString(database)
  if (!connStr) return NextResponse.json({ error: 'Missing connection details' }, { status: 400 })

  try {
    if (database.type === 'postgresql') {
      const pg = await import('pg').catch(() => { throw new Error('pg package not installed') }) as any
      const Client = pg.Client || pg.default?.Client || pg.default;
      const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 8000, ssl: database.ssl ? { rejectUnauthorized: false } : false })
      await client.connect()
      const orderClause = sortCol ? ` ORDER BY "${sortCol}" ${safeDir}` : ''
      const res = await client.query(`SELECT * FROM "${table}"${orderClause} LIMIT $1 OFFSET $2`, [safeLimit, safeOffset])
      await client.end()
      return NextResponse.json({ rows: res.rows })
    }

    if (database.type === 'mysql') {
      const mysql = await import('mysql2/promise').catch(() => { throw new Error('mysql2 package not installed') })
      const conn = await mysql.createConnection({ uri: connStr, connectTimeout: 8000 })
      const orderClause = sortCol ? ` ORDER BY \`${sortCol}\` ${safeDir}` : ''
      const [rows] = await conn.query(`SELECT * FROM \`${table}\`${orderClause} LIMIT ? OFFSET ?`, [safeLimit, safeOffset])
      await conn.end()
      return NextResponse.json({ rows })
    }

    if (database.type === 'mongodb') {
      const { MongoClient } = await import('mongodb').catch(() => { throw new Error('mongodb package not installed') })
      const client = new MongoClient(connStr, { connectTimeoutMS: 8000, serverSelectionTimeoutMS: 8000 })
      await client.connect()
      const sort = sortCol ? { [sortCol]: safeDir === 'DESC' ? -1 : 1 } as any : undefined
      let cursor = client.db().collection(table).find({}).skip(safeOffset).limit(safeLimit)
      if (sort) cursor = cursor.sort(sort)
      const rows = await cursor.toArray()
      await client.close()
      return NextResponse.json({ rows: rows.map((r: any) => ({ ...r, _id: r._id?.toString() })) })
    }

    return NextResponse.json({ error: `Query not supported for type: ${database.type}` }, { status: 400 })
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
  const proto = db.type === 'mysql' ? 'mysql' : db.type === 'mongodb' ? 'mongodb' : 'postgresql'
  return `${proto}://${auth}${db.host}${port}${dbName}`
}
