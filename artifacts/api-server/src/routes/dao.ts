import { Router } from "express";
import { db } from "@workspace/db";
import { daoProposalsTable, daoVotesTable } from "@workspace/db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

const router = Router();

const QUORUM_THRESHOLD = 10;

router.get("/stats", async (_req, res) => {
  try {
    const [totals, voteTotal] = await Promise.all([
      db
        .select({
          status: daoProposalsTable.status,
          cnt: count(),
        })
        .from(daoProposalsTable)
        .groupBy(daoProposalsTable.status),
      db.select({ cnt: count() }).from(daoVotesTable),
    ]);

    let totalProposals = 0;
    let activeProposals = 0;
    let passedProposals = 0;
    let failedProposals = 0;

    for (const row of totals) {
      totalProposals += Number(row.cnt);
      if (row.status === "active") activeProposals = Number(row.cnt);
      if (row.status === "passed") passedProposals = Number(row.cnt);
      if (row.status === "failed") failedProposals = Number(row.cnt);
    }

    res.json({
      totalProposals,
      activeProposals,
      passedProposals,
      failedProposals,
      totalVotesCast: voteTotal[0]?.cnt ?? 0,
      totalVotingPower: "0",
      quorumThreshold: QUORUM_THRESHOLD,
      isContractDeployed: false,
    });
  } catch (err) {
    console.error("DAO stats error:", err);
    res.status(500).json({ error: "Failed to get DAO stats" });
  }
});

router.get("/proposals", async (req, res) => {
  try {
    const { status, limit: limitStr } = req.query as { status?: string; limit?: string };
    const limit = Math.min(parseInt(limitStr ?? "20", 10), 100);

    let query = db.select().from(daoProposalsTable).orderBy(desc(daoProposalsTable.createdAt)).limit(limit);

    if (status) {
      const rows = await db
        .select()
        .from(daoProposalsTable)
        .where(eq(daoProposalsTable.status, status))
        .orderBy(desc(daoProposalsTable.createdAt))
        .limit(limit);
      res.json(rows.map(formatProposal));
      return;
    }

    const rows = await query;
    res.json(rows.map(formatProposal));
  } catch (err) {
    console.error("DAO proposals error:", err);
    res.status(500).json({ error: "Failed to list proposals" });
  }
});

router.post("/proposals", async (req, res) => {
  try {
    const { title, description, proposer, category, durationDays = 7 } = req.body;

    if (!title || !description || !proposer || !category) {
      res.status(400).json({ error: "Missing required fields: title, description, proposer, category" });
      return;
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const rows = await db
      .insert(daoProposalsTable)
      .values({
        title,
        description,
        proposer: proposer.toLowerCase(),
        category,
        status: "active",
        startTime,
        endTime,
      })
      .returning();

    res.status(201).json(formatProposal(rows[0]));
  } catch (err) {
    console.error("Create proposal error:", err);
    res.status(500).json({ error: "Failed to create proposal" });
  }
});

router.get("/proposals/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid proposal ID" });
      return;
    }

    const [proposal, votes] = await Promise.all([
      db.select().from(daoProposalsTable).where(eq(daoProposalsTable.id, id)).limit(1),
      db.select().from(daoVotesTable).where(eq(daoVotesTable.proposalId, id)).orderBy(desc(daoVotesTable.createdAt)),
    ]);

    if (!proposal[0]) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }

    res.json({
      ...formatProposal(proposal[0]),
      votes: votes.map(formatVote),
    });
  } catch (err) {
    console.error("Get proposal error:", err);
    res.status(500).json({ error: "Failed to get proposal" });
  }
});

router.post("/proposals/:id/vote", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid proposal ID" });
      return;
    }

    const { voter, voteChoice, votingPower = "1" } = req.body;
    if (!voter || !voteChoice || !["for", "against", "abstain"].includes(voteChoice)) {
      res.status(400).json({ error: "voter and voteChoice (for/against/abstain) are required" });
      return;
    }

    const [proposal] = await db.select().from(daoProposalsTable).where(eq(daoProposalsTable.id, id)).limit(1);
    if (!proposal) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }
    if (proposal.status !== "active") {
      res.status(400).json({ error: "Proposal is not active" });
      return;
    }

    const [voteRow] = await db
      .insert(daoVotesTable)
      .values({ proposalId: id, voter: voter.toLowerCase(), voteChoice, votingPower })
      .returning();

    const power = parseFloat(votingPower);
    const updateData: Record<string, unknown> = { totalVotes: proposal.totalVotes + 1 };
    if (voteChoice === "for") {
      updateData.votesFor = (parseFloat(proposal.votesFor) + power).toString();
    } else if (voteChoice === "against") {
      updateData.votesAgainst = (parseFloat(proposal.votesAgainst) + power).toString();
    } else {
      updateData.votesAbstain = (parseFloat(proposal.votesAbstain) + power).toString();
    }
    updateData.quorumReached = proposal.totalVotes + 1 >= QUORUM_THRESHOLD;

    await db.update(daoProposalsTable).set(updateData as Parameters<typeof db.update>[0]).where(eq(daoProposalsTable.id, id));

    res.status(201).json(formatVote(voteRow));
  } catch (err) {
    console.error("Cast vote error:", err);
    res.status(500).json({ error: "Failed to cast vote" });
  }
});

function formatProposal(row: typeof daoProposalsTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    proposer: row.proposer,
    status: row.status,
    category: row.category,
    votesFor: row.votesFor,
    votesAgainst: row.votesAgainst,
    votesAbstain: row.votesAbstain,
    totalVotes: row.totalVotes,
    quorumReached: row.quorumReached,
    startTime: row.startTime?.toISOString() ?? new Date().toISOString(),
    endTime: row.endTime?.toISOString() ?? new Date().toISOString(),
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

function formatVote(row: typeof daoVotesTable.$inferSelect) {
  return {
    id: row.id,
    proposalId: row.proposalId,
    voter: row.voter,
    voteChoice: row.voteChoice,
    votingPower: row.votingPower,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export default router;
