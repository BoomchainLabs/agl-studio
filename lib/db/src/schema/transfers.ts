import { pgTable, text, bigint, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transfersTable = pgTable("agl_transfers", {
  txHash: text("tx_hash").primaryKey(),
  blockNumber: bigint("block_number", { mode: "number" }).notNull(),
  from: text("from_address").notNull(),
  to: text("to_address").notNull(),
  amount: text("amount").notNull(),
  amountFormatted: text("amount_formatted").notNull(),
  isBurn: boolean("is_burn").notNull().default(false),
  timestamp: timestamp("timestamp", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransferSchema = createInsertSchema(transfersTable).omit({ createdAt: true });
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfersTable.$inferSelect;

export const cacheMetaTable = pgTable("agl_cache_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const burnHistoryTable = pgTable("agl_burn_history", {
  date: text("date").primaryKey(),
  burned: text("burned").notNull(),
  burnedFormatted: text("burned_formatted").notNull(),
  txCount: integer("tx_count").notNull().default(0),
});

export const insertBurnHistorySchema = createInsertSchema(burnHistoryTable);
export type InsertBurnHistory = z.infer<typeof insertBurnHistorySchema>;
export type BurnHistory = typeof burnHistoryTable.$inferSelect;
