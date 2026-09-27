import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../schema/index.js";
import { bootstrapAdminOwner, readBootstrapEnvironment } from "./admin-bootstrap.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const input = readBootstrapEnvironment(true);
const pool = new Pool({ connectionString });
try {
  const result = await bootstrapAdminOwner(drizzle(pool, { schema }), input);
  if (result.outcome === "created") console.log("Initial owner created successfully. Remove ADMIN_BOOTSTRAP_* secrets from the runtime environment.");
  else console.log("Bootstrap refused: an owner or administrator already exists; no credentials were changed.");
} finally {
  await pool.end();
}
