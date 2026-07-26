import { pgTable, serial, integer, varchar, text, numeric, timestamp, pgEnum, date } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { categoriesTable } from "./categories";

export const broadcastStatusEnum = pgEnum("broadcast_status", ["open", "closed"]);

export const broadcastsTable = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  buyer_id: integer("buyer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  buyer_name: varchar("buyer_name", { length: 255 }).notNull(),
  buyer_email: varchar("buyer_email", { length: 255 }),
  category_id: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  quantity: varchar("quantity", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  budget: numeric("budget", { precision: 14, scale: 2 }),
  deadline: date("deadline"),
  status: broadcastStatusEnum("status").notNull().default("open"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const broadcastResponsesTable = pgTable("broadcast_responses", {
  id: serial("id").primaryKey(),
  broadcast_id: integer("broadcast_id").notNull().references(() => broadcastsTable.id, { onDelete: "cascade" }),
  seller_id: integer("seller_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  seller_business_name: varchar("seller_business_name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  price_offer: numeric("price_offer", { precision: 14, scale: 2 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Broadcast = typeof broadcastsTable.$inferSelect;
export type BroadcastResponse = typeof broadcastResponsesTable.$inferSelect;
