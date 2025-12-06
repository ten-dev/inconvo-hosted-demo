import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, {
  schema,
  ...(env.NODE_ENV !== "production" && {
    logger: {
      logQuery: (query, params) => {
        console.log("Query:", query);
        console.log("Params:", params);
      },
    },
  }),
});
