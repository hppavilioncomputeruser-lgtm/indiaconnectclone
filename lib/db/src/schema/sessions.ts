import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";

// This table is managed by connect-pg-simple.
// We declare it here so Drizzle can push it with the rest of the schema.
export const sessionsTable = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});
