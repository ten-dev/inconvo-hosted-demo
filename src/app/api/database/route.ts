import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { count, sql } from "drizzle-orm";

import { DATABASE_TABLE_NAMES } from "~/data/database/tables";
import { getDb } from "~/server/db";
import {
  organisations,
  users,
  products,
  orders,
  reviews,
} from "~/server/db/schema";

const TABLE_MAP = {
  organisations,
  users,
  products,
  orders,
  reviews,
} as const;

const querySchema = z.object({
  table: z.enum(DATABASE_TABLE_NAMES),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(100),
  whereClause: z.string().optional(),
});

type QueryParams = z.infer<typeof querySchema>;

type DatabaseRow = Record<string, unknown>;

type DatabaseResponse = {
  rows: DatabaseRow[];
  columns: string[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
};

const toSnakeCase = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(toSnakeCase);
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, val]) => {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        acc[snakeKey] = toSnakeCase(val);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  return value;
};

const buildParams = (req: NextRequest): QueryParams => {
  const url = new URL(req.url);
  const getParam = (key: string) => {
    const value = url.searchParams.get(key);
    return value ?? undefined;
  };

  const parsed = querySchema.safeParse({
    table: getParam("table"),
    page: getParam("page"),
    pageSize: getParam("pageSize"),
    whereClause: getParam("whereClause"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid query params");
  }

  return parsed.data;
};

const runQuery = async ({
  table,
  page,
  pageSize,
  whereClause,
}: QueryParams): Promise<DatabaseResponse> => {
  const db = getDb();
  const tableDef = TABLE_MAP[table];
  const offset = (page - 1) * pageSize;

  let dataQuery = db.select().from(tableDef).$dynamic();
  let countQuery = db.select({ count: count() }).from(tableDef).$dynamic();

  if (whereClause) {
    const whereCondition = sql.raw(whereClause);
    dataQuery = dataQuery.where(whereCondition);
    countQuery = countQuery.where(whereCondition);
  }

  if ("id" in tableDef) {
    // drizzle table definitions expose column refs directly on the table object
    dataQuery = dataQuery.orderBy((tableDef as typeof tableDef & { id: unknown }).id as never);
  }

  const [dataResult, countResult] = await Promise.all([
    dataQuery.limit(pageSize).offset(offset),
    countQuery,
  ]);

  const rows = toSnakeCase(dataResult) as DatabaseRow[];
  const totalCount = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    rows,
    columns:
      rows.length > 0
        ? Object.keys(rows[0] as Record<string, unknown>)
        : [],
    totalPages,
    currentPage: page,
    totalCount,
  };
};

export async function GET(req: NextRequest) {
  try {
    const params = buildParams(req);
    const result = await runQuery(params);
    return NextResponse.json(result);
  } catch (error) {
    const baseMessage =
      error instanceof Error
        ? error.message
        : "Unable to fetch database table";

    const errorMessage = baseMessage.startsWith("Invalid query params")
      ? baseMessage
      : `Invalid SQL filter: ${baseMessage}`;

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
