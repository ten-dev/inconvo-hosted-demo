import type { DatabaseTableName } from "./tables";

export type SemanticColumn = {
  name: string;
  type: string;
};

export type SemanticViewerColumn = {
  field: string;
  label?: string;
  unit?: string;
};

export type SemanticRelation = {
  name: string;
  isList: boolean;
  targetTable: string;
  sourceColumns?: string[];
  targetColumns?: string[];
};

export type SemanticComputedColumn = {
  name: string;
  type: string;
  expression: string;
  unit?: string;
};

export type SemanticTable = {
  id: string;
  name: DatabaseTableName;
  description?: string;
  columns: SemanticColumn[];
  relations: SemanticRelation[];
  computedColumns?: SemanticComputedColumn[];
  context?: string;
  viewerColumns?: SemanticViewerColumn[];
};

export const SEMANTIC_TABLES: SemanticTable[] = [
  {
    id: "tbl_organisations",
    name: "organisations",
    description:
      "Top-level tenants that isolate data for each storefront in the demo environment.",
    columns: [
      { name: "id", type: "number" },
      { name: "name", type: "string" },
      { name: "created_at", type: "DateTime" },
    ],
    relations: [
      { name: "products", isList: true, targetTable: "products" },
      { name: "orders", isList: true, targetTable: "orders" },
      { name: "reviews", isList: true, targetTable: "reviews" },
      { name: "users", isList: true, targetTable: "users" },
    ],
    viewerColumns: [
      { field: "id" },
      { field: "name" },
      { field: "created_at" },
    ],
  },
  {
    id: "tbl_products",
    name: "products",
    description:
      "Catalog entries with merchandising metadata and stock levels.",
    context: "Products are considered low stock when stock_level is below 20.",
    columns: [
      { name: "organisation_id", type: "number" },
      { name: "id", type: "number" },
      { name: "ean", type: "string" },
      { name: "title", type: "string" },
      { name: "category", type: "string" },
      { name: "price", type: "number" },
      { name: "stock_level", type: "number" },
      { name: "created_at", type: "DateTime" },
    ],
    relations: [
      {
        name: "organisation",
        isList: false,
        targetTable: "organisations",
        sourceColumns: ["organisation_id"],
        targetColumns: ["id"],
      },
      { name: "orders", isList: true, targetTable: "orders" },
      { name: "reviews", isList: true, targetTable: "reviews" },
    ],
    viewerColumns: [
      { field: "id" },
      { field: "organisation_id" },
      { field: "title" },
      { field: "category" },
      { field: "price", unit: "USD" },
      { field: "stock_level" },
      { field: "created_at" },
    ],
  },
  {
    id: "tbl_orders",
    name: "orders",
    description: "Transactional headers for all store purchases.",
    columns: [
      { name: "organisation_id", type: "number" },
      { name: "id", type: "number" },
      { name: "user_id", type: "number" },
      { name: "product_id", type: "number" },
      { name: "subtotal", type: "number" },
      { name: "tax", type: "number" },
      { name: "discount", type: "number" },
      { name: "created_at", type: "DateTime" },
      { name: "quantity", type: "number" },
    ],
    computedColumns: [
      {
        name: "total",
        type: "number",
        unit: "USD",
        expression: "(subtotal - discount) + tax",
      },
    ],
    relations: [
      {
        name: "organisation",
        isList: false,
        targetTable: "organisations",
        sourceColumns: ["organisation_id"],
        targetColumns: ["id"],
      },
      {
        name: "user",
        isList: false,
        targetTable: "users",
        sourceColumns: ["user_id"],
        targetColumns: ["id"],
      },
      {
        name: "product",
        isList: false,
        targetTable: "products",
        sourceColumns: ["product_id"],
        targetColumns: ["id"],
      },
    ],
    viewerColumns: [
      { field: "id", label: "order_id" },
      { field: "organisation_id" },
      { field: "user_id" },
      { field: "product_id" },
      { field: "subtotal", unit: "USD" },
      { field: "tax", unit: "USD" },
      { field: "discount", unit: "USD" },
      { field: "quantity" },
      { field: "created_at" },
    ],
  },
  {
    id: "tbl_reviews",
    name: "reviews",
    description: "Post-purchase feedback captured for each order line.",
    columns: [
      { name: "organisation_id", type: "number" },
      { name: "id", type: "number" },
      { name: "product_id", type: "number" },
      { name: "user_id", type: "number" },
      { name: "rating", type: "number" },
      { name: "comment", type: "string" },
      { name: "created_at", type: "DateTime" },
    ],
    relations: [
      {
        name: "organisation",
        isList: false,
        targetTable: "organisations",
        sourceColumns: ["organisation_id"],
        targetColumns: ["id"],
      },
      {
        name: "user",
        isList: false,
        targetTable: "users",
        sourceColumns: ["user_id"],
        targetColumns: ["id"],
      },
      {
        name: "product",
        isList: false,
        targetTable: "products",
        sourceColumns: ["product_id"],
        targetColumns: ["id"],
      },
    ],
    viewerColumns: [
      { field: "id" },
      { field: "organisation_id" },
      { field: "product_id" },
      { field: "user_id" },
      { field: "rating" },
      { field: "comment" },
      { field: "created_at" },
    ],
  },
  {
    id: "tbl_users",
    name: "users",
    description: "Accounts that interact with the storefront.",
    context:
      "Users are referred to as accounts. A user is considered a customer if last_order_at is not null. New customers in a time period have their first order within that range.",
    columns: [
      { name: "organisation_id", type: "number" },
      { name: "id", type: "number" },
      { name: "address", type: "string" },
      { name: "email", type: "string" },
      { name: "password", type: "string" },
      { name: "name", type: "string" },
      { name: "city", type: "string" },
      { name: "longitude", type: "number" },
      { name: "birth_date", type: "DateTime" },
      { name: "zip", type: "string" },
      { name: "latitude", type: "number" },
      { name: "created_at", type: "DateTime" },
      { name: "last_order_at", type: "DateTime" },
    ],
    relations: [
      { name: "orders", isList: true, targetTable: "orders" },
      { name: "reviews", isList: true, targetTable: "reviews" },
      {
        name: "organisation",
        isList: false,
        targetTable: "organisations",
        sourceColumns: ["organisation_id"],
        targetColumns: ["id"],
      },
    ],
    viewerColumns: [
      { field: "id" },
      { field: "organisation_id" },
      { field: "name" },
      { field: "email" },
      { field: "city" },
      { field: "created_at" },
      { field: "last_order_at" },
    ],
  },
];

export const SEMANTIC_TABLE_MAP = SEMANTIC_TABLES.reduce<
  Record<string, SemanticTable>
>((acc, table) => {
  acc[table.id] = table;
  return acc;
}, {});
