import {
  pgTable,
  unique,
  integer,
  varchar,
  timestamp,
  index,
  foreignKey,
  doublePrecision,
  date,
  char,
  smallint,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

export const organisations = pgTable(
  "organisations",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity({
      name: "organisations_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("organisations_name_key").on(table.name)],
);

export const users = pgTable(
  "users",
  {
    organisationId: integer("organisation_id").notNull(),
    id: integer().primaryKey().generatedByDefaultAsIdentity({
      name: "users_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    address: varchar({ length: 255 }),
    email: varchar({ length: 255 }),
    password: varchar({ length: 255 }),
    name: varchar({ length: 255 }),
    city: varchar({ length: 255 }),
    longitude: doublePrecision(),
    birthDate: date("birth_date"),
    zip: char({ length: 5 }),
    latitude: doublePrecision(),
    createdAt: timestamp("created_at", { mode: "string" }),
    lastOrderAt: timestamp("last_order_at", { mode: "string" }),
  },
  (table) => [
    index("idx_users_org").using(
      "btree",
      table.organisationId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organisationId],
      foreignColumns: [organisations.id],
      name: "users_organisation_id_fkey",
    }),
  ],
);

export const products = pgTable(
  "products",
  {
    organisationId: integer("organisation_id").notNull(),
    id: integer().primaryKey().generatedByDefaultAsIdentity({
      name: "products_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    ean: char({ length: 13 }),
    title: varchar({ length: 255 }),
    category: varchar({ length: 255 }),
    price: doublePrecision(),
    stockLevel: integer("stock_level"),
    createdAt: timestamp("created_at", { mode: "string" }),
  },
  (table) => [
    index("idx_products_org").using(
      "btree",
      table.organisationId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organisationId],
      foreignColumns: [organisations.id],
      name: "products_organisation_id_fkey",
    }),
  ],
);

export const orders = pgTable(
  "orders",
  {
    organisationId: integer("organisation_id").notNull(),
    id: integer().primaryKey().generatedByDefaultAsIdentity({
      name: "orders_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    userId: integer("user_id"),
    productId: integer("product_id"),
    subtotal: doublePrecision(),
    tax: doublePrecision(),
    discount: doublePrecision(),
    createdAt: timestamp("created_at", { mode: "string" }),
    quantity: integer(),
  },
  (table) => [
    index("idx_orders_org").using(
      "btree",
      table.organisationId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organisationId],
      foreignColumns: [organisations.id],
      name: "orders_organisation_id_fkey",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "orders_user_id_fkey",
    }),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "orders_product_id_fkey",
    }),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    organisationId: integer("organisation_id").notNull(),
    id: integer().primaryKey().generatedByDefaultAsIdentity({
      name: "reviews_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    productId: integer("product_id"),
    userId: integer("user_id"),
    rating: smallint(),
    comment: text(),
    createdAt: timestamp("created_at", { mode: "string" }),
  },
  (table) => [
    index("idx_reviews_org").using(
      "btree",
      table.organisationId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organisationId],
      foreignColumns: [organisations.id],
      name: "reviews_organisation_id_fkey",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "reviews_user_id_fkey",
    }),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "reviews_product_id_fkey",
    }),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [users.organisationId],
    references: [organisations.id],
  }),
  orders: many(orders),
  reviews: many(reviews),
}));

export const organisationsRelations = relations(organisations, ({ many }) => ({
  users: many(users),
  products: many(products),
  orders: many(orders),
  reviews: many(reviews),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [products.organisationId],
    references: [organisations.id],
  }),
  orders: many(orders),
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  organisation: one(organisations, {
    fields: [orders.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  organisation: one(organisations, {
    fields: [reviews.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));
