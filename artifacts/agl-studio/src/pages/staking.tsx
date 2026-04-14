import { useGetStakingStats, getGetStakingStatsQueryKey, useListStakingPositions, getListStakingPositionsQueryKey, useGetStakingLeaderboard, getGetStakingLeaderboardQueryKey, useGetStakingPosition, getGetStakingPositionQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Lock, ShieldCheck, Trophy, Search, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { formatAddress } from "@/lib/utils";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function Staking() {
  const { data: stats, isLoading: statsLoading } = useGetStakingStats({ query: { queryKey: getGetStakingStatsQueryKey() } });
  const { data: leaderboard, isLoading: lbLoading } = useGetStakingLeaderboard({ limit: 10 }, { query: { queryKey: getGetStakingLeaderboardQueryKey({ limit: 10 }) } });
  const { data: positions, isLoading: posLoading } = useListStakingPositions({ limit: 10 }, { query: { queryKey: getListStakingPositionsQueryKey({ limit: 10 }) } });

  const [lookupAddress, setLookupAddress] = useState("");
  const [activeAddress, setActiveAddress] = useState("");

  const { data: lookupPos, isLoading: lookupLoading, isError: lookupError } = useGetStakingPosition(activeAddress, { 
    query: { enabled: !!activeAddress, queryKey: getGetStakingPositionQueryKey(activeAddress), retry: false } 
  });

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupAddress.trim()) {
      setActiveAddress(lookupAddress.trim());
    }
  };

  if (stats && !stats.isContractDeployed) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6 max-w-lg mx-auto text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary blur-3xl opacity-20 rounded-full"></div>
          <Layers className="h-24 w-24 text-primary relative z-10 opacity-80" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight uppercase text-primary">Staking Coming Soon</h1>
        <p className="text-muted-foreground">The AGL staking contract is currently being audited and will be deployed shortly. Prepare to earn yield by locking your tokens.</p>
        <Card className="w-full border-primary/20 bg-card/50 rounded-none border-dashed">
          <CardContent className="p-4 text-sm font-mono text-primary/70">
            CONTRACT_ADDRESS: PENDING_DEPLOYMENT
          </CardContent>
        </Card>
      </div>
    );
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase text-primary flex items-center gap-3">
            <Layers className="h-8 w-8" />
            Staking Portal
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Lock AGL to secure the network and earn yields.</p>
        </div>
        {stats && (
          <div className="hidden md:block text-right">
            <div className="text-xs text-muted-foreground font-mono">CONTRACT</div>
            <div className="text-sm text-primary font-mono bg-primary/10 px-2 py-1 border border-primary/20 mt-1">
              {stats.contractAddress ? formatAddress(stats.contractAddress) : 'UNKNOWN'}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="TOTAL STAKED" value={stats?.totalStakedFormatted} suffix="AGL" loading={statsLoading} icon={<ShieldCheck />} />
        <StatsCard title="ACTIVE STAKERS" value={stats?.totalStakers?.toLocaleString()} loading={statsLoading} icon={<Layers />} />
        <StatsCard title="EST. APY" value={stats ? `${stats.estimatedApy}%` : undefined} loading={statsLoading} valueClass="text-primary" icon={<TrendingUpIcon />} />
        <StatsCard title="TOTAL REWARDS" value={stats?.totalRewardsFormatted} suffix="AGL" loading={statsLoading} icon={<Trophy />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="positions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none bg-background border border-primary/20">
              <TabsTrigger value="positions" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">Recent Positions</TabsTrigger>
              <TabsTrigger value="leaderboard" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">Leaderboard</TabsTrigger>
            </TabsList>
            <TabsContent value="positions" className="mt-4">
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-none">
                <CardContent className="p-0">
                  {posLoading ? <div className="p-4 space-y-4">{Array(5).fill(0).map((_,i)=><Skeleton key={i} className="h-12 w-full bg-primary/5" />)}</div> : (
                    <div className="divide-y divide-primary/10">
                      {positions?.map((pos) => (
                        <div key={pos.id} className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors font-mono text-sm">
                          <div>
                            <div className="text-primary">{formatAddress(pos.address)}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Lock className="h-3 w-3" /> {pos.lockDuration} Days
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{pos.stakedAmountFormatted} AGL</div>
                            <Badge variant="outline" className={`text-[10px] mt-1 rounded-none border-primary/20 ${pos.status === 'active' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                              {pos.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {!positions?.length && <div className="p-8 text-center text-muted-foreground">No active positions</div>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="leaderboard" className="mt-4">
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-none">
                <CardContent className="p-0">
                  {lbLoading ? <div className="p-4 space-y-4">{Array(5).fill(0).map((_,i)=><Skeleton key={i} className="h-12 w-full bg-primary/5" />)}</div> : (
                    <div className="divide-y divide-primary/10">
                      {leaderboard?.map((entry) => (
                        <div key={entry.address} className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors font-mono text-sm">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 flex items-center justify-center border ${entry.rank <= 3 ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>
                              {entry.rank}
                            </div>
                            <div className={entry.rank <= 3 ? 'text-foreground' : 'text-muted-foreground'}>
                              {formatAddress(entry.address)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">{entry.stakedAmountFormatted} AGL</div>
                            <div className="text-xs text-muted-foreground mt-1">+{entry.rewardsFormatted} Earned</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-card/50 rounded-none bg-[linear-gradient(45deg,var(--tw-gradient-stops))] from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Position Lookup
              </CardTitle>
              <CardDescription>Enter a wallet address to view staking details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="flex flex-col gap-3">
                <Input 
                  placeholder="0x..." 
                  className="rounded-none border-primary/30 bg-black/50 focus-visible:ring-primary font-mono"
                  value={lookupAddress}
                  onChange={(e) => setLookupAddress(e.target.value)}
                />
                <Button type="submit" className="rounded-none w-full" disabled={!lookupAddress.trim() || lookupLoading}>
                  {lookupLoading ? 'SEARCHING...' : 'LOOKUP ADDRESS'}
                </Button>
              </form>

              {activeAddress && (
                <div className="mt-6 pt-6 border-t border-primary/20 font-mono">
                  {lookupLoading ? <Skeleton className="h-24 w-full bg-primary/5" /> : lookupError ? (
                    <div className="text-center text-sm text-destructive flex flex-col items-center gap-2 py-4">
                      <AlertTriangle className="h-6 w-6" />
                      No active stake found
                    </div>
                  ) : lookupPos ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-muted-foreground">STAKED AMOUNT</div>
                        <div className="text-xl font-bold text-primary">{lookupPos.stakedAmountFormatted} AGL</div>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground">REWARDS</div>
                          <div className="text-sm text-foreground">+{lookupPos.rewardsFormatted} AGL</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">LOCK DURATION</div>
                          <div className="text-sm text-foreground">{lookupPos.lockDuration} Days</div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`w-full justify-center rounded-none border-primary/30 py-1 ${lookupPos.status === 'active' ? 'bg-primary/10 text-primary' : ''}`}>
                        STATUS: {lookupPos.status.toUpperCase()}
                      </Badge>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function TrendingUpIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className="text-primary"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>;
}

function StatsCard({ title, value, suffix, icon, loading, valueClass = "text-foreground" }: any) {
  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-none border-l-2 border-l-primary hover:bg-primary/5 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground">{title}</CardTitle>
        <div className="text-primary/50">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24 bg-primary/10" />
        ) : (
          <div className="flex items-baseline gap-1">
            <div className={`text-2xl font-bold tracking-tight ${valueClass}`}>
              {value || "---"}
            </div>
            {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}