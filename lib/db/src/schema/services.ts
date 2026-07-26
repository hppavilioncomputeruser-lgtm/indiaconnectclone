import { pgTable, serial, integer, varchar, text, numeric, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { categoriesTable } from "./categories";

export const priceUnitEnum = pgEnum("price_unit", ["per_hour", "per_day", "per_project", "fixed", "negotiable"]);

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  seller_id: integer("seller_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  category_id: integer("category_id").notNull().references(() => categoriesTable.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price_min: numeric("price_min", { precision: 12, scale: 2 }),
  price_max: numeric("price_max", { precision: 12, scale: 2 }),
  price_unit: priceUnitEnum("price_unit").notNull().default("negotiable"),
  images: text("images").array().notNull().default([]),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  is_featured: boolean("is_featured").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertServiceSchema = createInsertSchema(servicesTable).omit({ id: true, created_at: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof servicesTable.$inferSelect;
