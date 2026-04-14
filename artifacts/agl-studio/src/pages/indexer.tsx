import { useGetIndexerStatus, getGetIndexerStatusQueryKey, useTriggerIndexerSync } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, Database, RefreshCw, Layers, AlertCircle, Play, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Indexer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useGetIndexerStatus({ query: { queryKey: getGetIndexerStatusQueryKey(), refetchInterval: 5000 } });
  const syncMutation = useTriggerIndexerSync();

  const handleSync = async () => {
    try {
      const res = await syncMutation.mutateAsync({});
      toast({
        title: "Sync Triggered",
        description: res.message,
      });
      queryClient.invalidateQueries({ queryKey: getGetIndexerStatusQueryKey() });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: err.message || "Failed to trigger sync",
      });
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase text-primary flex items-center gap-3">
            <Database className="h-8 w-8" />
            Indexer Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Live monitoring of AGL network event synchronization.</p>
        </div>
        <div className="flex items-center gap-4">
          {status && (
            <div className={`hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 border ${status.isRunning ? 'text-primary/70 bg-primary/10 border-primary/20' : 'text-muted-foreground bg-muted/50 border-border'}`}>
              <span className="relative flex h-2 w-2">
                {status.isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${status.isRunning ? 'bg-primary' : 'bg-muted-foreground'}`}></span>
              </span>
              SYS: {status.isRunning ? 'INDEXING' : 'IDLE'}
            </div>
          )}
          <Button 
            variant="outline" 
            className="border-primary/20 text-primary hover:bg-primary/10 rounded-none h-9"
            onClick={handleSync}
            disabled={syncMutation.isPending || status?.isRunning}
          >
            {syncMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            FORCE SYNC
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div variants={item}>
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground flex items-center justify-between">
                SYNC STATUS
                <Activity className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-32 bg-primary/10" /> : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-foreground">
                    {status?.syncProgress.toFixed(2)}%
                  </div>
                  <Progress value={status?.syncProgress || 0} className="h-1 bg-primary/10 [&>div]:bg-primary" />
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>{status?.lastSyncedBlock?.toLocaleString()}</span>
                    <span>{status?.currentBlock?.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground flex items-center justify-between">
                BLOCKS BEHIND
                <Layers className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24 bg-primary/10" /> : (
                <div className={`text-2xl font-bold tracking-tight ${(status?.blocksBehinad || 0) > 100 ? 'text-destructive glow-text-destructive' : 'text-primary'}`}>
                  {status?.blocksBehinad?.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground flex items-center justify-between">
                LAST SYNC
                <RefreshCw className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-32 bg-primary/10" /> : (
                <div className="text-sm font-medium text-foreground">
                  {status?.lastSyncAt ? formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true }) : 'Never'}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={item}>
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-none h-full">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Indexed Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? <Skeleton className="h-32 w-full bg-primary/5" /> : (
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-border/50 pb-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground tracking-widest">TOTAL EVENTS</p>
                      <p className="text-2xl font-mono text-primary">{status?.totalEventsIndexed?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end border-b border-border/50 pb-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground tracking-widest">TOTAL BURNS</p>
                      <p className="text-2xl font-mono text-destructive">{status?.totalBurnsIndexed?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground tracking-widest">START BLOCK</p>
                      <p className="text-lg font-mono text-foreground">{status?.startBlock?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm rounded-none h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary blur-3xl opacity-20 rounded-full"></div>
                <Database className="h-16 w-16 text-primary relative z-10 opacity-80" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2 tracking-widest">SYSTEM OPTIMAL</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                The indexing node is actively monitoring the Base blockchain for new token transfers and burn events.
              </p>
              {status?.blocksBehinad !== undefined && status.blocksBehinad > 50 && (
                <div className="mt-6 flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 border border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  NODE FALLING BEHIND
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}