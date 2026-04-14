import { db, transfersTable, cacheMetaTable, burnHistoryTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { formatUnits } from "viem";
import { publicClient, aglAbi, AGL_CONTRACT_ADDRESS, ZERO_ADDRESS, AGL_DECIMALS, formatAGL } from "./blockchain";
import { logger } from "./logger";

const SYNC_CACHE_KEY = "last_synced_block";
const SYNC_BATCH_SIZE = 2000n;
const START_BLOCK = 22_000_000n;

export async function getLastSyncedBlock(): Promise<bigint> {
  try {
    const [row] = await db.select().from(cacheMetaTable).where(eq(cacheMetaTable.key, SYNC_CACHE_KEY));
    if (row) return BigInt(row.value);
  } catch {
    // ignore
  }
  return START_BLOCK;
}

export async function setLastSyncedBlock(block: bigint): Promise<void> {
  await db
    .insert(cacheMetaTable)
    .values({ key: SYNC_CACHE_KEY, value: block.toString() })
    .onConflictDoUpdate({ target: cacheMetaTable.key, set: { value: block.toString(), updatedAt: new Date() } });
}

export async function syncTransfers(): Promise<void> {
  try {
    const currentBlock = await publicClient.getBlockNumber();
    const lastSynced = await getLastSyncedBlock();

    if (currentBlock <= lastSynced) {
      logger.debug("No new blocks to sync");
      return;
    }

    const fromBlock = lastSynced + 1n;
    const toBlock = fromBlock + SYNC_BATCH_SIZE > currentBlock ? currentBlock : fromBlock + SYNC_BATCH_SIZE;

    logger.info({ fromBlock: fromBlock.toString(), toBlock: toBlock.toString() }, "Syncing transfer events");

    const transferEvent = aglAbi.find(
      (e): e is { type: "event"; name: string; inputs: readonly any[] } =>
        e.type === "event" && "name" in e && e.name === "Transfer"
    );

    if (!transferEvent) return;

    const logs = await publicClient.getLogs({
      address: AGL_CONTRACT_ADDRESS,
      event: transferEvent as any,
      fromBlock,
      toBlock,
    });

    if (logs.length === 0) {
      await setLastSyncedBlock(toBlock);
      return;
    }

    const transfers = logs.map((log: any) => {
      const from = (log.args?.from ?? "").toLowerCase();
      const to = (log.args?.to ?? "").toLowerCase();
      const value: bigint = log.args?.value ?? 0n;
      const isBurn = to === ZERO_ADDRESS.toLowerCase();

      return {
        txHash: log.transactionHash ?? `unknown-${log.blockNumber}-${Math.random()}`,
        blockNumber: Number(log.blockNumber),
        from,
        to,
        amount: value.toString(),
        amountFormatted: formatAGL(value),
        isBurn,
        timestamp: null as Date | null,
      };
    });

    if (transfers.length > 0) {
      await db.insert(transfersTable).values(transfers).onConflictDoNothing();
    }

    await setLastSyncedBlock(toBlock);
    logger.info({ count: transfers.length, upTo: toBlock.toString() }, "Synced transfers");

    await updateBurnHistory();
  } catch (err) {
    logger.error({ err }, "Transfer sync failed");
  }
}

async function updateBurnHistory(): Promise<void> {
  try {
    const burns = await db
      .select({
        date: sql<string>`to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        totalBurned: sql<string>`sum(amount::numeric)`,
        txCount: sql<number>`count(*)`,
      })
      .from(transfersTable)
      .where(eq(transfersTable.isBurn, true))
      .groupBy(sql`to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`);

    for (const row of burns) {
      const burned = BigInt(Math.round(parseFloat(row.totalBurned || "0")));
      await db
        .insert(burnHistoryTable)
        .values({
          date: row.date,
          burned: burned.toString(),
          burnedFormatted: formatAGL(burned),
          txCount: Number(row.txCount),
        })
        .onConflictDoUpdate({
          target: burnHistoryTable.date,
          set: {
            burned: burned.toString(),
            burnedFormatted: formatAGL(burned),
            txCount: Number(row.txCount),
          },
        });
    }
  } catch (err) {
    logger.warn({ err }, "Failed to update burn history");
  }
}
