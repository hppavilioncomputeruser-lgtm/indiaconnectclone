import { pgTable, serial, integer, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const verificationStatusEnum = pgEnum("verification_status", ["pending", "approved", "rejected"]);

export const sellerProfilesTable = pgTable("seller_profiles", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  business_name: varchar("business_name", { length: 255 }).notNull(),
  business_description: text("business_description"),
  aadhaar_last4: varchar("aadhaar_last4", { length: 4 }).notNull(),
  gst_number: varchar("gst_number", { length: 15 }).notNull().unique(),
  verification_status: verificationStatusEnum("verification_status").notNull().default("pending"),
  rejection_reason: text("rejection_reason"),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  pincode: varchar("pincode", { length: 10 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertSellerProfileSchema = createInsertSchema(sellerProfilesTable).omit({ id: true, created_at: true });
export type InsertSellerProfile = z.infer<typeof insertSellerProfileSchema>;
export type SellerProfile = typeof sellerProfilesTable.$inferSelect;
