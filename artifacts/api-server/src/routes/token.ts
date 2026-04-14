import { Router, type IRouter } from "express";
import { db, transfersTable, cacheMetaTable, burnHistoryTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  GetTokenInfoResponse,
  GetTokenStatsResponse,
  GetTokenBalanceParams,
  GetTokenBalanceResponse,
  ListTransfersQueryParams,
  ListTransfersResponse,
  ListBurnsQueryParams,
  ListBurnsResponse,
  GetAnalyticsOverviewResponse,
  GetBurnHistoryResponse,
} from "@workspace/api-zod";
import {
  publicClient,
  AGL_CONTRACT_ADDRESS,
  AGL_DECIMALS,
  BASE_RPC_URL,
  BASE_EXPLORER_URL,
  fetchTotalSupply,
  fetchBalance,
  formatAGL,
  aglAbi,
  ZERO_ADDRESS,
} from "../lib/blockchain";
import { syncTransfers } from "../lib/syncTransfers";
import { logger } from "../lib/logger";
import { formatUnits, isAddress } from "viem";

const router: IRouter = Router();

let syncInProgress = false;
async function triggerSync() {
  if (syncInProgress) return;
  syncInProgress = true;
  syncTransfers().finally(() => {
    syncInProgress = false;
  });
}

router.get("/token/info", async (req, res): Promise<void> => {
  try {
    const totalSupply = await fetchTotalSupply();
    const info = GetTokenInfoResponse.parse({
      name: "Agunnaya Labs",
      symbol: "AGL",
      decimals: AGL_DECIMALS,
      totalSupply: totalSupply.toString(),
      totalSupplyFormatted: formatAGL(totalSupply),
      contractAddress: AGL_CONTRACT_ADDRESS,
      chainId: 8453,
      chainName: "Base",
      rpcUrl: BASE_RPC_URL,
      explorerUrl: BASE_EXPLORER_URL,
    });
    res.json(info);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch token info");
    res.status(500).json({ error: "Failed to fetch token info" });
  }
});

router.get("/token/stats", async (req, res): Promise<void> => {
  triggerSync().catch(() => {});
  try {
    const totalSupply = await fetchTotalSupply();

    const [burnSum] = await db
      .select({ total: sql<string>`coalesce(sum(amount::numeric), 0)::text` })
      .from(transfersTable)
      .where(eq(transfersTable.isBurn, true));

    const [recentTransferCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transfersTable)
      .where(eq(transfersTable.isBurn, false));

    const [recentBurnCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transfersTable)
      .where(eq(transfersTable.isBurn, true));

    const totalBurned = BigInt(Math.round(parseFloat(burnSum?.total || "0")));
    const circulatingSupply = totalSupply - totalBurned;
    const burnPct = totalSupply > 0n ? Number((totalBurned * 10000n) / totalSupply) / 100 : 0;

    const stats = GetTokenStatsResponse.parse({
      totalSupply: totalSupply.toString(),
      totalSupplyFormatted: formatAGL(totalSupply),
      circulatingSupply: circulatingSupply.toString(),
      circulatingSupplyFormatted: formatAGL(circulatingSupply),
      totalBurned: totalBurned.toString(),
      totalBurnedFormatted: formatAGL(totalBurned),
      burnPercentage: burnPct,
      recentTransferCount: Number(recentTransferCount?.count ?? 0),
      recentBurnCount: Number(recentBurnCount?.count ?? 0),
      lastUpdated: new Date().toISOString(),
    });

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch token stats");
    res.status(500).json({ error: "Failed to fetch token stats" });
  }
});

router.get("/token/balance/:address", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.address) ? req.params.address[0] : req.params.address;

  if (!isAddress(raw)) {
    res.status(400).json({ error: "Invalid Ethereum address" });
    return;
  }

  try {
    const balance = await fetchBalance(raw);
    const result = GetTokenBalanceResponse.parse({
      address: raw,
      balance: balance.toString(),
      balanceFormatted: formatAGL(balance),
      symbol: "AGL",
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch balance");
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

router.get("/transfers", async (req, res): Promise<void> => {
  triggerSync().catch(() => {});
  const parsed = ListTransfersQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const addressFilter = parsed.success ? parsed.data.address : undefined;

  try {
    let query = db
      .select()
      .from(transfersTable)
      .orderBy(desc(transfersTable.blockNumber))
      .limit(limit);

    let rows;
    if (addressFilter && isAddress(addressFilter)) {
      rows = await db
        .select()
        .from(transfersTable)
        .where(
          sql`(${transfersTable.from} = ${addressFilter.toLowerCase()} OR ${transfersTable.to} = ${addressFilter.toLowerCase()})`
        )
        .orderBy(desc(transfersTable.blockNumber))
        .limit(limit);
    } else {
      rows = await query;
    }

    const result = ListTransfersResponse.parse(
      rows.map((r) => ({
        txHash: r.txHash,
        blockNumber: r.blockNumber,
        from: r.from,
        to: r.to,
        amount: r.amount,
        amountFormatted: r.amountFormatted,
        timestamp: r.timestamp?.toISOString() ?? null,
        isBurn: r.isBurn,
      }))
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list transfers");
    res.status(500).json({ error: "Failed to list transfers" });
  }
});

router.get("/burns", async (req, res): Promise<void> => {
  const parsed = ListBurnsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

  try {
    const rows = await db
      .select()
      .from(transfersTable)
      .where(eq(transfersTable.isBurn, true))
      .orderBy(desc(transfersTable.blockNumber))
      .limit(limit);

    const result = ListBurnsResponse.parse(
      rows.map((r) => ({
        txHash: r.txHash,
        blockNumber: r.blockNumber,
        burner: r.from,
        amount: r.amount,
        amountFormatted: r.amountFormatted,
        timestamp: r.timestamp?.toISOString() ?? null,
      }))
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list burns");
    res.status(500).json({ error: "Failed to list burns" });
  }
});

router.get("/analytics/overview", async (req, res): Promise<void> => {
  triggerSync().catch(() => {});
  try {
    const totalSupply = await fetchTotalSupply();

    const [burnSum] = await db
      .select({ total: sql<string>`coalesce(sum(amount::numeric), 0)::text` })
      .from(transfersTable)
      .where(eq(transfersTable.isBurn, true));

    const [transferVol] = await db
      .select({
        total: sql<string>`coalesce(sum(amount::numeric), 0)::text`,
        count: sql<number>`count(*)`,
      })
      .from(transfersTable)
      .where(and(eq(transfersTable.isBurn, false), sql`created_at > now() - interval '24 hours'`));

    const [burnVol] = await db
      .select({
        total: sql<string>`coalesce(sum(amount::numeric), 0)::text`,
        count: sql<number>`count(*)`,
      })
      .from(transfersTable)
      .where(and(eq(transfersTable.isBurn, true), sql`created_at > now() - interval '24 hours'`));

    const [largestBurnRow] = await db
      .select({ amount: sql<string>`coalesce(max(amount::numeric), 0)::text` })
      .from(transfersTable)
      .where(eq(transfersTable.isBurn, true));

    const totalBurned = BigInt(Math.round(parseFloat(burnSum?.total || "0")));
    const burnPct = totalSupply > 0n ? Number((totalBurned * 10000n) / totalSupply) / 100 : 0;
    const largestBurn = BigInt(Math.round(parseFloat(largestBurnRow?.amount || "0")));

    const result = GetAnalyticsOverviewResponse.parse({
      totalSupply: totalSupply.toString(),
      totalBurned: totalBurned.toString(),
      burnPercentage: burnPct,
      transferVolume24h: transferVol?.total ?? "0",
      transferCount24h: Number(transferVol?.count ?? 0),
      burnVolume24h: burnVol?.total ?? "0",
      burnCount24h: Number(burnVol?.count ?? 0),
      largestBurn: largestBurn.toString(),
      largestBurnFormatted: formatAGL(largestBurn),
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get analytics overview");
    res.status(500).json({ error: "Failed to get analytics overview" });
  }
});

router.get("/analytics/burn-history", async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(burnHistoryTable)
      .orderBy(burnHistoryTable.date)
      .limit(90);

    const result = GetBurnHistoryResponse.parse(
      rows.map((r) => ({
        date: r.date,
        burned: r.burned,
        burnedFormatted: r.burnedFormatted,
        txCount: r.txCount,
      }))
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get burn history");
    res.status(500).json({ error: "Failed to get burn history" });
  }
});

export default router;
