import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stakingPositionsTable = pgTable("agl_staking_positions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  address: text("address").notNull().unique(),
  stakedAmount: text("staked_amount").notNull().default("0"),
  stakedAmountFormatted: text("staked_amount_formatted").notNull().default("0"),
  rewardsEarned: text("rewards_earned").notNull().default("0"),
  rewardsFormatted: text("rewards_formatted").notNull().default("0"),
  lockDuration: integer("lock_duration").notNull().default(30),
  status: text("status").notNull().default("active"),
  stakedAt: timestamp("staked_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStakingPositionSchema = createInsertSchema(stakingPositionsTable);
export type InsertStakingPosition = z.infer<typeof insertStakingPositionSchema>;
export type StakingPosition = typeof stakingPositionsTable.$inferSelect;
