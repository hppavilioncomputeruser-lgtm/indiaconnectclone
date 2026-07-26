import { pgTable, serial, integer, text, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { inquiriesTable } from "./inquiries";

export const senderRoleEnum = pgEnum("sender_role", ["buyer", "seller"]);

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  inquiry_id: integer("inquiry_id").notNull().references(() => inquiriesTable.id, { onDelete: "cascade" }),
  sender_id: integer("sender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  sender_role: senderRoleEnum("sender_role").notNull(),
  body: text("body").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Message = typeof messagesTable.$inferSelect;
