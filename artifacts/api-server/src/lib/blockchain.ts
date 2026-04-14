import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { base } from "viem/chains";
import { logger } from "./logger";

export const AGL_CONTRACT_ADDRESS = "0xEA1221B4d80A89BD8C75248Fae7c176BD1854698" as const;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
export const BASE_RPC_URL = "https://mainnet.base.org";
export const BASE_EXPLORER_URL = "https://basescan.org";
export const AGL_DECIMALS = 18;
export const AGL_TOTAL_SUPPLY_RAW = BigInt("1000000000") * BigInt(10 ** 18);

export const aglAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL, {
    timeout: 15_000,
    retryCount: 3,
    retryDelay: 1000,
  }),
});

export function formatAGL(wei: bigint): string {
  const formatted = formatUnits(wei, AGL_DECIMALS);
  const num = parseFloat(formatted);
  if (num >= 1_000_000) {
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return num.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export async function fetchTotalSupply(): Promise<bigint> {
  try {
    const supply = await publicClient.readContract({
      address: AGL_CONTRACT_ADDRESS,
      abi: aglAbi,
      functionName: "totalSupply",
    });
    return supply as bigint;
  } catch (err) {
    logger.warn({ err }, "Failed to fetch totalSupply from chain, using constant");
    return AGL_TOTAL_SUPPLY_RAW;
  }
}

export async function fetchBalance(address: string): Promise<bigint> {
  const balance = await publicClient.readContract({
    address: AGL_CONTRACT_ADDRESS,
    abi: aglAbi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });
  return balance as bigint;
}

export async function getTokenStats() {
  const { db } = await import("@workspace/db");
  const { transfersTable } = await import("@workspace/db/schema");
  const { sql: drizzleSql } = await import("drizzle-orm");

  const totalSupply = await fetchTotalSupply();

  const burnRows = await db
    .select({ total: drizzleSql<string>`COALESCE(SUM(CAST(amount AS NUMERIC)), 0)::TEXT` })
    .from(transfersTable)
    .where(drizzleSql`is_burn = true`);

  const totalBurned = BigInt(Math.round(parseFloat(burnRows[0]?.total ?? "0")));
  const circulatingSupply = totalSupply - totalBurned;
  const burnPercentage = totalSupply > 0n ? Number((totalBurned * 10000n) / totalSupply) / 100 : 0;

  return {
    totalSupply: totalSupply.toString(),
    totalSupplyFormatted: formatAGL(totalSupply) + " AGL",
    totalBurned: totalBurned.toString(),
    totalBurnedFormatted: formatAGL(totalBurned) + " AGL",
    circulatingSupply: circulatingSupply.toString(),
    circulatingSupplyFormatted: formatAGL(circulatingSupply) + " AGL",
    burnPercentage,
  };
}

export async function fetchRecentTransferLogs(fromBlock: bigint, toBlock: bigint | "latest") {
  try {
    const logs = await publicClient.getLogs({
      address: AGL_CONTRACT_ADDRESS,
      event: aglAbi.find((e) => e.type === "event" && "name" in e && e.name === "Transfer") as any,
      fromBlock,
      toBlock: toBlock === "latest" ? "latest" : toBlock,
    });
    return logs;
  } catch (err) {
    logger.warn({ err }, "Failed to fetch transfer logs");
    return [];
  }
}
