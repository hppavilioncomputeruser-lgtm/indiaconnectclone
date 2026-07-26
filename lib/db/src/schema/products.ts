import { pgTable, serial, integer, varchar, text, numeric, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { categoriesTable } from "./categories";

export const listingStatusEnum = pgEnum("listing_status", ["active", "inactive"]);

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  seller_id: integer("seller_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  category_id: integer("category_id").notNull().references(() => categoriesTable.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price_min: numeric("price_min", { precision: 12, scale: 2 }),
  price_max: numeric("price_max", { precision: 12, scale: 2 }),
  unit: varchar("unit", { length: 50 }).notNull().default("piece"),
  images: text("images").array().notNull().default([]),
  status: listingStatusEnum("status").notNull().default("active"),
  is_featured: boolean("is_featured").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, created_at: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
