import { useGetAnalyticsOverview, getGetAnalyticsOverviewQueryKey, useGetBurnHistory, getGetBurnHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { formatNumber } from "@/lib/utils";

export default function Analytics() {
  const { data: overview, isLoading: overviewLoading } = useGetAnalyticsOverview({ query: { queryKey: getGetAnalyticsOverviewQueryKey() } });
  const { data: history, isLoading: historyLoading } = useGetBurnHistory({ query: { queryKey: getGetBurnHistoryQueryKey() } });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="border-b border-border/50 pb-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight uppercase text-primary">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Deep dive into AGL token metrics and burn velocity.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="24H TRANSFER VOL" value={overview?.transferVolume24h ? formatNumber(overview.transferVolume24h) : undefined} loading={overviewLoading} suffix="AGL" />
        <MetricCard title="24H TRANSFERS" value={overview?.transferCount24h.toString()} loading={overviewLoading} />
        <MetricCard title="24H BURN VOL" value={overview?.burnVolume24h ? formatNumber(overview.burnVolume24h) : undefined} loading={overviewLoading} suffix="AGL" valueClass="text-destructive" />
        <MetricCard title="LARGEST BURN" value={overview?.largestBurnFormatted} loading={overviewLoading} suffix="AGL" valueClass="text-destructive glow-text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <Card className="border-destructive/20 bg-card/50 rounded-none h-[400px]">
            <CardHeader className="border-b border-destructive/10 pb-4">
              <CardTitle className="text-sm font-bold tracking-widest text-destructive">BURN HISTORY OVER TIME</CardTitle>
              <CardDescription>Daily burn volume mapped against time.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
              {historyLoading ? (
                <Skeleton className="w-full h-full bg-destructive/10" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${(value / 1e6).toFixed(0)}M`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--destructive))', borderRadius: 0, color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--destructive))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
                      formatter={(value: any) => [`${formatNumber(value)} AGL`, 'Burned']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    />
                    <Area type="monotone" dataKey="burnedFormatted" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorBurn)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <Card className="border-primary/20 bg-card/50 rounded-none h-[400px]">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="text-sm font-bold tracking-widest text-primary">DAILY TX COUNT</CardTitle>
              <CardDescription>Number of transactions resulting in burns.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
              {historyLoading ? (
                <Skeleton className="w-full h-full bg-primary/10" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--primary))', borderRadius: 0, color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
                      formatter={(value: any) => [`${value} Txs`, 'Transactions']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    />
                    <Bar dataKey="txCount" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function MetricCard({ title, value, loading, suffix, valueClass = "text-foreground" }: { title: string, value?: string, loading: boolean, suffix?: string, valueClass?: string }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
      <Card className="border-border bg-card/30 rounded-none h-full hover:bg-card/50 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-bold tracking-widest text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-6 w-16 bg-primary/10" />
          ) : (
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-bold tracking-tight ${valueClass}`}>{value || "---"}</span>
              {suffix && <span className="text-xs text-muted-foreground font-medium">{suffix}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
