import { useGetTokenStats, getGetTokenStatsQueryKey, useListBurns, getListBurnsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flame, AlertTriangle, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { formatAddress } from "@/lib/utils";

export default function Burn() {
  const { data: stats, isLoading: statsLoading } = useGetTokenStats({ query: { queryKey: getGetTokenStatsQueryKey() } });
  const { data: burns, isLoading: burnsLoading } = useListBurns({ limit: 50 }, { query: { queryKey: getListBurnsQueryKey({ limit: 50 }) } });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col items-center text-center space-y-4 py-12 border-b border-destructive/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-destructive/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-destructive/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/30 text-destructive z-10">
          <Flame className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter uppercase text-destructive glow-text-destructive z-10">Burn Portal</h1>
        <p className="text-muted-foreground max-w-2xl z-10">
          AGL tokens sent to the null address (0x000...000) are permanently removed from circulation. 
          This deflationary mechanism increases scarcity over time.
        </p>

        <div className="flex items-center gap-8 mt-8 z-10">
          <div className="text-center">
            <div className="text-sm text-muted-foreground font-bold tracking-widest mb-1">TOTAL BURNED</div>
            {statsLoading ? (
              <Skeleton className="h-10 w-40 mx-auto bg-destructive/10" />
            ) : (
              <div className="text-3xl font-bold text-destructive">{stats?.totalBurnedFormatted} AGL</div>
            )}
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <div className="text-sm text-muted-foreground font-bold tracking-widest mb-1">BURN RATE</div>
            {statsLoading ? (
              <Skeleton className="h-10 w-24 mx-auto bg-destructive/10" />
            ) : (
              <div className="text-3xl font-bold text-destructive">{stats?.burnPercentage.toFixed(4)}%</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-destructive/5 border border-destructive/20 p-6 flex gap-4 text-sm text-destructive/80">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
        <p>
          <strong className="text-destructive font-bold">WARNING:</strong> Burning tokens is irreversible. 
          Once sent to the burn address, tokens can never be recovered. Only send tokens you intend to destroy.
        </p>
      </div>

      <Card className="border-destructive/20 bg-card/50 rounded-none">
        <CardHeader className="border-b border-destructive/10">
          <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center justify-between text-destructive">
            <span>Recent Burn Events</span>
            <span className="text-xs text-muted-foreground font-normal">Last 50 Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {burnsLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-12 w-full bg-destructive/10" />)}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-destructive/5 border-b border-destructive/10">
                  <tr>
                    <th className="px-6 py-3 font-bold tracking-widest">Time</th>
                    <th className="px-6 py-3 font-bold tracking-widest">Burner</th>
                    <th className="px-6 py-3 font-bold tracking-widest text-right">Amount Burned</th>
                    <th className="px-6 py-3 font-bold tracking-widest text-right">Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-destructive/10">
                  {burns?.map((burn) => (
                    <tr key={burn.txHash} className="hover:bg-destructive/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {burn.timestamp ? new Date(burn.timestamp).toLocaleString() : 'Pending'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {formatAddress(burn.burner)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-destructive">
                        -{burn.amountFormatted} AGL
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a 
                          href={`https://basescan.org/tx/${burn.txHash}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          {formatAddress(burn.txHash)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {!burns?.length && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        No burn events found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
