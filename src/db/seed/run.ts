import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../schema/index.js";
import { seedCatalog } from "./catalog.js";

// NOTE: the runner owns its Pool instead of importing src/db/client.ts so
// `tsx` never loads the `server-only` boundary marker (Node has no
// react-server condition). Same database, same seed function.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString });
try {
  const counts = await seedCatalog(drizzle(pool, { schema }));
  console.log(`seeded catalog: ${counts.categories} categories, ${counts.products} products, ${counts.images} images, ${counts.links} category links`);
} finally {
  await pool.end();
}
