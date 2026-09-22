import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = ReturnType<typeof getDb>;

let pool: Pool | undefined;

// Explicit lazy singleton: importing this module never opens a connection.
// Callers must run on the server only (enforced by the marker above).
export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    pool = new Pool({ connectionString });
  }
  return drizzle(pool, { schema });
}
