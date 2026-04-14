import { Router } from "express";
import { db } from "@workspace/db";
import { stakingPositionsTable } from "@workspace/db/schema";
import { desc, eq, count, sql } from "drizzle-orm";

const router = Router();

const STAKING_CONTRACT_ADDRESS = null;
const ESTIMATED_APY = 12.5;

router.get("/stats", async (_req, res) => {
  try {
    const [countResult, sumResult, rewardsResult] = await Promise.all([
      db.select({ count: count() }).from(stakingPositionsTable).where(eq(stakingPositionsTable.status, "active")),
      db
        .select({ total: sql<string>`COALESCE(SUM(CAST(staked_amount AS NUMERIC)), 0)::TEXT` })
        .from(stakingPositionsTable)
        .where(eq(stakingPositionsTable.status, "active")),
      db
        .select({ total: sql<string>`COALESCE(SUM(CAST(rewards_earned AS NUMERIC)), 0)::TEXT` })
        .from(stakingPositionsTable),
    ]);

    const totalStakedRaw = sumResult[0]?.total ?? "0";
    const totalRewardsRaw = rewardsResult[0]?.total ?? "0";
    const totalStakers = countResult[0]?.count ?? 0;

    const formatAGL = (raw: string) => {
      const n = parseFloat(raw) / 1e18;
      return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    };

    res.json({
      totalStaked: totalStakedRaw,
      totalStakedFormatted: formatAGL(totalStakedRaw) + " AGL",
      totalStakers,
      contractAddress: STAKING_CONTRACT_ADDRESS,
      isContractDeployed: false,
      estimatedApy: ESTIMATED_APY,
      totalRewardsDistributed: totalRewardsRaw,
      totalRewardsFormatted: formatAGL(totalRewardsRaw) + " AGL",
    });
  } catch (err) {
    console.error("Staking stats error:", err);
    res.status(500).json({ error: "Failed to get staking stats" });
  }
});

router.get("/positions", async (req, res) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) ?? "20", 10), 100);
    const address = req.query.address as string | undefined;

    let query = db.select().from(stakingPositionsTable).orderBy(desc(stakingPositionsTable.stakedAt)).limit(limit);

    if (address) {
      const result = await db
        .select()
        .from(stakingPositionsTable)
        .where(eq(stakingPositionsTable.address, address.toLowerCase()))
        .limit(1);
      res.json(result.map(formatPosition));
      return;
    }

    const rows = await query;
    res.json(rows.map(formatPosition));
  } catch (err) {
    console.error("Staking positions error:", err);
    res.status(500).json({ error: "Failed to get staking positions" });
  }
});

router.get("/positions/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const rows = await db
      .select()
      .from(stakingPositionsTable)
      .where(eq(stakingPositionsTable.address, address.toLowerCase()))
      .limit(1);

    if (!rows[0]) {
      res.status(404).json({ error: "Position not found" });
      return;
    }
    res.json(formatPosition(rows[0]));
  } catch (err) {
    console.error("Staking position error:", err);
    res.status(500).json({ error: "Failed to get staking position" });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) ?? "10", 10), 50);
    const rows = await db
      .select()
      .from(stakingPositionsTable)
      .where(eq(stakingPositionsTable.status, "active"))
      .orderBy(sql`CAST(staked_amount AS NUMERIC) DESC`)
      .limit(limit);

    const leaderboard = rows.map((row, idx) => ({
      rank: idx + 1,
      address: row.address,
      stakedAmount: row.stakedAmount,
      stakedAmountFormatted: row.stakedAmountFormatted,
      rewardsEarned: row.rewardsEarned,
      rewardsFormatted: row.rewardsFormatted,
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error("Staking leaderboard error:", err);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

function formatPosition(row: typeof stakingPositionsTable.$inferSelect) {
  return {
    id: row.id,
    address: row.address,
    stakedAmount: row.stakedAmount,
    stakedAmountFormatted: row.stakedAmountFormatted,
    rewardsEarned: row.rewardsEarned,
    rewardsFormatted: row.rewardsFormatted,
    stakedAt: row.stakedAt?.toISOString() ?? new Date().toISOString(),
    lockDuration: row.lockDuration,
    status: row.status,
  };
}

export default router;
