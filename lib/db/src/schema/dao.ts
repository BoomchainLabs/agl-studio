import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const daoProposalsTable = pgTable("agl_dao_proposals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  proposer: text("proposer").notNull(),
  status: text("status").notNull().default("active"),
  category: text("category").notNull(),
  votesFor: text("votes_for").notNull().default("0"),
  votesAgainst: text("votes_against").notNull().default("0"),
  votesAbstain: text("votes_abstain").notNull().default("0"),
  totalVotes: integer("total_votes").notNull().default(0),
  quorumReached: boolean("quorum_reached").notNull().default(false),
  startTime: timestamp("start_time", { withTimezone: true }).notNull().defaultNow(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const daoVotesTable = pgTable("agl_dao_votes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  proposalId: integer("proposal_id").notNull().references(() => daoProposalsTable.id),
  voter: text("voter").notNull(),
  voteChoice: text("vote_choice").notNull(),
  votingPower: text("voting_power").notNull().default("1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDaoProposalSchema = createInsertSchema(daoProposalsTable);
export type InsertDaoProposal = z.infer<typeof insertDaoProposalSchema>;
export type DaoProposal = typeof daoProposalsTable.$inferSelect;

export const insertDaoVoteSchema = createInsertSchema(daoVotesTable);
export type InsertDaoVote = z.infer<typeof insertDaoVoteSchema>;
export type DaoVote = typeof daoVotesTable.$inferSelect;
