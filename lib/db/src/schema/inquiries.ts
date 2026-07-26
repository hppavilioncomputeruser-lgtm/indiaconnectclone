import { pgTable, serial, integer, varchar, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const inquiryStatusEnum = pgEnum("inquiry_status", ["pending", "responded", "closed"]);
export const listingTypeEnum = pgEnum("listing_type", ["product", "service"]);

export const inquiriesTable = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  buyer_id: integer("buyer_id").references(() => usersTable.id, { onDelete: "set null" }),
  buyer_name: varchar("buyer_name", { length: 255 }).notNull(),
  buyer_email: varchar("buyer_email", { length: 255 }),
  buyer_phone: varchar("buyer_phone", { length: 20 }),
  seller_id: integer("seller_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  product_id: integer("product_id"),
  service_id: integer("service_id"),
  listing_title: varchar("listing_title", { length: 255 }).notNull(),
  listing_type: listingTypeEnum("listing_type").notNull(),
  message: text("message").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  status: inquiryStatusEnum("status").notNull().default("pending"),
  seller_response: text("seller_response"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertInquirySchema = createInsertSchema(inquiriesTable).omit({ id: true, created_at: true });
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiriesTable.$inferSelect;
