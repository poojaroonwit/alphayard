import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'

// POST /api/v1/admin/applications/[id]/config/database/studio/tables
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const { database } = await request.json()
  if (!database) return NextResponse.json({ error: 'No database config' }, { status: 400 })

  const connStr = database.connectionString || buildConnectionString(database)
  if (!connStr) return NextResponse.json({ error: 'Missing connection details' }, { status: 400 })

  try {
    if (database.type === 'postgresql') {
      const pg = await import('pg').catch(() => { throw new Error('pg package not installed') }) as any
      const Client = pg.Client || pg.default?.Client || pg.default;
      const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 8000, ssl: database.ssl ? { rejectUnauthorized: false } : false })
      await client.connect()

      const tablesRes = await client.query(`
        SELECT t.table_name,
               (SELECT reltuples::bigint FROM pg_class WHERE relname = t.table_name) as row_count
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
      `)

      const tables = await Promise.all(tablesRes.rows.map(async (row: any) => {
        const colsRes = await client.query(`
          SELECT 
            c.column_name as name, 
            c.data_type as type, 
            c.is_nullable,
            EXISTS (
              SELECT 1 FROM information_schema.key_column_usage kcu
              JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
              WHERE kcu.table_name = c.table_name AND kcu.column_name = c.column_name AND tc.constraint_type = 'PRIMARY KEY'
            ) as is_primary
          FROM information_schema.columns c
          WHERE c.table_schema = 'public' AND c.table_name = $1
          ORDER BY c.ordinal_position
        `, [row.table_name])

        return {
          name: row.table_name,
          rowCount: Number(row.row_count) || 0,
          columns: colsRes.rows.map((c: any) => ({
            name: c.name,
            type: c.type,
            nullable: c.is_nullable === 'YES',
            isPrimary: !!c.is_primary,
          })),
        }
      }))

      await client.end()
      return NextResponse.json({ tables })
    }

    if (database.type === 'mysql') {
      const mysql = await import('mysql2/promise').catch(() => { throw new Error('mysql2 package not installed') })
      const conn = await mysql.createConnection({ uri: connStr, connectTimeout: 8000 })
      const dbName = connStr.split('/').pop()?.split('?')[0]

      const [tableRows] = await conn.query<any[]>(`
        SELECT table_name, table_rows as row_count
        FROM information_schema.tables
        WHERE table_schema = ?
        ORDER BY table_name
      `, [dbName])

      const tables = await Promise.all(tableRows.map(async (row: any) => {
        const [colRows] = await conn.query<any[]>(`
          SELECT column_name as name, data_type as type, is_nullable, column_key
          FROM information_schema.columns
          WHERE table_schema = ? AND table_name = ?
          ORDER BY ordinal_position
        `, [dbName, row.table_name])

        return {
          name: row.table_name,
          rowCount: Number(row.row_count) || 0,
          columns: colRows.map((c: any) => ({ 
            name: c.name, 
            type: c.type, 
            nullable: c.is_nullable === 'YES',
            isPrimary: c.column_key === 'PRI'
          })),
        }
      }))

      await conn.end()
      return NextResponse.json({ tables })
    }

    if (database.type === 'mongodb') {
      const { MongoClient } = await import('mongodb').catch(() => { throw new Error('mongodb package not installed') })
      const client = new MongoClient(connStr, { connectTimeoutMS: 8000, serverSelectionTimeoutMS: 8000 })
      await client.connect()
      const db = client.db()
      const collections = await db.listCollections().toArray()
      const tables = await Promise.all(collections.map(async (col) => {
        const count = await db.collection(col.name).estimatedDocumentCount()
        return { name: col.name, rowCount: count, columns: [] }
      }))
      await client.close()
      return NextResponse.json({ tables })
    }

    return NextResponse.json({ error: `Studio not supported for type: ${database.type}` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tables' }, { status: 500 })
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
