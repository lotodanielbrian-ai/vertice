import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export function createDb(
  databaseUrl = process.env.DATABASE_URL ??
    'postgres://pcbuilder:pcbuilder@localhost:5432/pcbuilder',
) {
  const client = postgres(databaseUrl, { max: 8 })
  const db = drizzle(client, { schema })
  return { db, client }
}

export type Database = ReturnType<typeof createDb>['db']
