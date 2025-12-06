export const DATABASE_TABLE_NAMES = [
  "organisations",
  "users",
  "products",
  "orders",
  "reviews",
] as const;

export type DatabaseTableName = (typeof DATABASE_TABLE_NAMES)[number];
