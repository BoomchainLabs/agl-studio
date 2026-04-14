import { Router } from "express";
import { db } from "@workspace/db";
import { cacheMetaTable, transfersTable } from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";
import { burnHistoryTable } from "@workspace/db/schema";
import { syncTransfers } from "../lib/syncTransfers.js";
import { publicClient, AGL_CONTRACT } from "../lib/blockchain.js";

const router = Router();

const START_BLOCK = 22_000_000;

router.get("/status", async (_req, res) => {
  try {
    const [lastSyncedRow, currentBlockBig, transferCountRows, burnCountRows] = await Promise.all([
      db.select().from(cacheMetaTable).where(eq(cacheMetaTable.key, "lastSyncedBlock")).limit(1),
      publicClient.getBlockNumber(),
      db.select({ count: count() }).from(transfersTable),
      db.select({ count: count() }).from(transfersTable).where(eq(transfersTable.isBurn, true)),
    ]);

    const lastSyncedBlock = lastSyncedRow[0] ? parseInt(lastSyncedRow[0].value, 10) : START_BLOCK;
    const currentBlock = Number(currentBlockBig);
    const blocksBehinad = Math.max(0, currentBlock - lastSyncedBlock);
    const syncRange = currentBlock - START_BLOCK;
    const synced = lastSyncedBlock - START_BLOCK;
    const syncProgress = syncRange > 0 ? Math.min(100, (synced / syncRange) * 100) : 0;

    const lastSyncAtRow = await db.select().from(cacheMetaTable).where(eq(cacheMetaTable.key, "lastSyncAt")).limit(1);

    res.json({
      isRunning: true,
      lastSyncedBlock,
      currentBlock,
      blocksBehinad,
      totalEventsIndexed: transferCountRows[0]?.count ?? 0,
      totalBurnsIndexed: burnCountRows[0]?.count ?? 0,
      syncProgress: Math.round(syncProgress * 100) / 100,
      lastSyncAt: lastSyncAtRow[0]?.value ?? null,
      startBlock: START_BLOCK,
    });
  } catch (err) {
    console.error("Indexer status error:", err);
    res.status(500).json({ error: "Failed to get indexer status" });
  }
});

router.post("/sync", async (_req, res) => {
  try {
    await syncTransfers();

    await db
      .insert(cacheMetaTable)
      .values({ key: "lastSyncAt", value: new Date().toISOString() })
      .onConflictDoUpdate({ target: cacheMetaTable.key, set: { value: new Date().toISOString(), updatedAt: new Date() } });

    res.json({ triggered: true, message: "Sync cycle completed successfully" });
  } catch (err) {
    console.error("Manual sync error:", err);
    res.status(500).json({ triggered: false, message: "Sync failed: " + (err as Error).message });
  }
});

export default router;
