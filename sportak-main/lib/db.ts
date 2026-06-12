import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import * as schema from "@/db/schema"

// TURSO_DATABASE_URL = "file:./dev.db"          (local dev)
// TURSO_DATABASE_URL = "libsql://..."            (Turso cloud)
// TURSO_AUTH_TOKEN   = undefined                 (local dev, not required)
// TURSO_AUTH_TOKEN   = "eyJ..."                  (Turso cloud)

type DB = ReturnType<typeof drizzle<typeof schema>>

function createDb(): DB {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error("Missing env var: TURSO_DATABASE_URL")
  }
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return drizzle(client, { schema })
}

// Lazily initialized singleton — no side effects at import time so this
// module is safe to include in the client bundle (it is never actually
// called there, but tree-shaking in Pages Router is imperfect).
let _db: DB | undefined

export const db = new Proxy({} as DB, {
  get(_, prop) {
    if (!_db) _db = createDb()
    return (_db as DB)[prop as keyof DB]
  },
})
