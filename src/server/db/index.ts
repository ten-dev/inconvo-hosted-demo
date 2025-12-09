import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// Cache from react to cache the client during the same request
// this is not mandatory and only has an effect for server components
import { cache } from "react";

import { env } from "~/env";
import * as schema from "./schema";

export const getDb = cache(() => {
  const conn = postgres(env.DATABASE_URL, {
    // Don't reuse the same connection for multiple requests
    // This is required for Cloudflare Workers compatibility
    max: 1,
  });

  return drizzle(conn, {
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
});
