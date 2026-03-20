import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'

// POST /api/v1/admin/applications/[id]/config/database/studio/update
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const { database, table, primaryKey, originalRow, updatedRow } = await request.json()
  if (!database || !table || !primaryKey || !updatedRow) {
    return NextResponse.json({ error: 'Missing update parameters' }, { status: 400 })
  }

  // Sanitize table name
  if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(table)) {
    return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
  }

  const connStr = database.connectionString || buildConnectionString(database)
  if (!connStr) return NextResponse.json({ error: 'Missing connection details' }, { status: 400 })

  try {
    if (database.type === 'postgresql') {
      const pg = await import('pg').catch(() => { throw new Error('pg package not installed') }) as any
      const Client = pg.Client || pg.default?.Client || pg.default;
      const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 8000, ssl: database.ssl ? { rejectUnauthorized: false } : false })
      await client.connect()

      const setClause = Object.keys(updatedRow)
        .map((key, i) => `"${key}" = $${i + 1}`)
        .join(', ')
      const pkClause = Object.keys(primaryKey)
        .map((key, i) => `"${key}" = $${Object.keys(updatedRow).length + i + 1}`)
        .join(' AND ')
      
      const values = [...Object.values(updatedRow), ...Object.values(primaryKey)]
      const query = `UPDATE "${table}" SET ${setClause} WHERE ${pkClause}`
      
      await client.query(query, values)
      await client.end()
      return NextResponse.json({ ok: true })
    }

    if (database.type === 'mysql') {
      const mysql = await import('mysql2/promise').catch(() => { throw new Error('mysql2 package not installed') })
      const conn = await mysql.createConnection({ uri: connStr, connectTimeout: 8000 })
      
      const setClause = Object.keys(updatedRow)
        .map(key => `\`${key}\` = ?`)
        .join(', ')
      const pkClause = Object.keys(primaryKey)
        .map(key => `\`${key}\` = ?`)
        .join(' AND ')
      
      const values = [...Object.values(updatedRow), ...Object.values(primaryKey)]
      const query = `UPDATE \`${table}\` SET ${setClause} WHERE ${pkClause}`
      
      await conn.execute(query, values as any[])
      await conn.end()
      return NextResponse.json({ ok: true })
    }

    if (database.type === 'mongodb') {
      const { MongoClient, ObjectId } = await import('mongodb').catch(() => { throw new Error('mongodb package not installed') })
      const client = new MongoClient(connStr, { connectTimeoutMS: 8000, serverSelectionTimeoutMS: 8000 })
      await client.connect()
      
      const db = client.db()
      const query: any = {}
      Object.entries(primaryKey).forEach(([k, v]) => {
        if (k === '_id') query[k] = new ObjectId(v as string)
        else query[k] = v
      })

      const update = { $set: updatedRow }
      await db.collection(table).updateOne(query, update)
      await client.close()
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: `Update not supported for type: ${database.type}` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 })
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
