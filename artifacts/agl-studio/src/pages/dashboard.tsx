import { useGetTokenStats, getGetTokenStatsQueryKey, useListTransfers, getListTransfersQueryKey, useListBurns, getListBurnsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Flame, ArrowRightLeft, RefreshCw, Box } from "lucide-react";
import { motion } from "framer-motion";
import { formatAddress } from "@/lib/utils";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetTokenStats({ query: { queryKey: getGetTokenStatsQueryKey() } });
  const { data: transfers, isLoading: transfersLoading } = useListTransfers({ limit: 5 }, { query: { queryKey: getListTransfersQueryKey({ limit: 5 }) } });
  const { data: burns, isLoading: burnsLoading } = useListBurns({ limit: 5 }, { query: { queryKey: getListBurnsQueryKey({ limit: 5 }) } });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase text-primary">Terminal Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Live AGL network statistics and events.</p>
        </div>
        {stats && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-primary/70 bg-primary/10 px-3 py-1.5 border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            LAST UPDATED: {new Date(stats.lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="TOTAL SUPPLY" 
          value={stats?.totalSupplyFormatted} 
          icon={<Box className="h-4 w-4 text-primary" />} 
          loading={statsLoading} 
        />
        <StatsCard 
          title="CIRCULATING" 
          value={(Number(stats?.circulatingSupply) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 })} 
          icon={<RefreshCw className="h-4 w-4 text-primary" />} 
          loading={statsLoading} 
        />
        <StatsCard 
          title="TOTAL BURNED" 
          value={stats?.totalBurnedFormatted} 
          icon={<Flame className="h-4 w-4 text-destructive" />} 
          loading={statsLoading} 
          valueClass="text-destructive glow-text-destructive"
        />
        <StatsCard 
          title="BURN PERCENTAGE" 
          value={stats ? `${stats.burnPercentage.toFixed(4)}%` : undefined} 
          icon={<Activity className="h-4 w-4 text-primary" />} 
          loading={statsLoading} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <motion.div variants={item}>
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-none">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                Recent Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transfersLoading ? (
                <div className="p-4 space-y-4">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full bg-primary/5" />)}
                </div>
              ) : (
                <div className="divide-y divide-primary/10">
                  {transfers?.map((tx) => (
                    <div key={tx.txHash} className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">TX HASH</span>
                        <a href={`https://basescan.org/tx/${tx.txHash}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {formatAddress(tx.txHash)}
                        </a>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground text-xs">AMOUNT</span>
                        <span className="font-bold">{tx.amountFormatted} AGL</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-xs">FROM &rarr; TO</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{formatAddress(tx.from)}</span>
                          <span className="text-primary/50">&rarr;</span>
                          <span>{formatAddress(tx.to)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-destructive/20 bg-card/50 backdrop-blur-sm rounded-none">
            <CardHeader className="border-b border-destructive/10 pb-4">
              <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2 text-destructive">
                <Flame className="h-4 w-4" />
                Recent Burns
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {burnsLoading ? (
                <div className="p-4 space-y-4">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full bg-destructive/5" />)}
                </div>
              ) : (
                <div className="divide-y divide-destructive/10">
                  {burns?.map((burn) => (
                    <div key={burn.txHash} className="p-4 flex items-center justify-between hover:bg-destructive/5 transition-colors text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">TX HASH</span>
                        <a href={`https://basescan.org/tx/${burn.txHash}`} target="_blank" rel="noreferrer" className="text-destructive hover:underline">
                          {formatAddress(burn.txHash)}
                        </a>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground text-xs">BURNER</span>
                        <span>{formatAddress(burn.burner)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-xs">AMOUNT BURNED</span>
                        <span className="font-bold text-destructive">-{burn.amountFormatted} AGL</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatsCard({ title, value, icon, loading, valueClass = "text-foreground" }: { title: string, value?: string, icon: React.ReactNode, loading: boolean, valueClass?: string }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-none hover:border-primary/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24 bg-primary/10" />
          ) : (
            <div className={`text-2xl font-bold tracking-tight ${valueClass}`}>
              {value || "---"}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
