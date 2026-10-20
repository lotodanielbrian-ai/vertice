import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDb } from './client'

const folder = resolve(dirname(fileURLToPath(import.meta.url)), '../drizzle')
const { db, client } = createDb()
await migrate(db, { migrationsFolder: folder })
await client.end()
console.log(`Migraciones aplicadas desde ${folder}`)
