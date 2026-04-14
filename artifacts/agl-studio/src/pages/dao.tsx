import { useState } from "react";
import { Link } from "wouter";
import { useGetDaoStats, getGetDaoStatsQueryKey, useListDaoProposals, getListDaoProposalsQueryKey, useCreateDaoProposal } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Vote, FileText, CheckCircle2, XCircle, Clock, AlertTriangle, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { formatAddress } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function DaoGovernance() {
  const { data: stats, isLoading: statsLoading } = useGetDaoStats({ query: { queryKey: getGetDaoStatsQueryKey() } });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: proposals, isLoading: propsLoading } = useListDaoProposals(
    { status: statusFilter === "all" ? null : statusFilter as any }, 
    { query: { queryKey: getListDaoProposalsQueryKey({ status: statusFilter === "all" ? null : statusFilter as any }) } }
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateDaoProposal();
  const [open, setOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createMutation.mutateAsync({
        data: {
          title: fd.get("title") as string,
          description: fd.get("description") as string,
          proposer: "0x" + Math.random().toString(16).slice(2, 42), // mock for now
          category: fd.get("category") as string,
          durationDays: Number(fd.get("duration")),
        }
      });
      toast({ title: "Proposal Created", description: "Your governance proposal is now on-chain." });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: getListDaoProposalsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDaoStatsQueryKey() });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  if (stats && !stats.isContractDeployed) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6 max-w-lg mx-auto text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary blur-3xl opacity-20 rounded-full"></div>
          <Vote className="h-24 w-24 text-primary relative z-10 opacity-80" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight uppercase text-primary">DAO Governance Coming Soon</h1>
        <p className="text-muted-foreground">On-chain voting is being finalized. Soon, AGL holders will govern protocol upgrades, parameter changes, and treasury usage.</p>
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
            <Vote className="h-8 w-8" />
            DAO Governance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Shape the future of the AGL protocol.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
              <FileText className="mr-2 h-4 w-4" />
              CREATE PROPOSAL
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-primary/20 rounded-none font-mono">
            <DialogHeader>
              <DialogTitle className="text-xl uppercase tracking-widest text-primary">New Proposal</DialogTitle>
              <DialogDescription>Submit a formal governance proposal to the DAO.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs tracking-widest text-muted-foreground">TITLE</label>
                <Input name="title" required className="rounded-none border-primary/30 bg-black/50 focus-visible:ring-primary" placeholder="AIP-..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs tracking-widest text-muted-foreground">CATEGORY</label>
                  <Select name="category" defaultValue="core">
                    <SelectTrigger className="rounded-none border-primary/30 bg-black/50">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-primary/30 bg-card">
                      <SelectItem value="core">Core Protocol</SelectItem>
                      <SelectItem value="treasury">Treasury</SelectItem>
                      <SelectItem value="ecosystem">Ecosystem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs tracking-widest text-muted-foreground">DURATION (DAYS)</label>
                  <Input name="duration" type="number" defaultValue="3" min="1" max="14" className="rounded-none border-primary/30 bg-black/50 focus-visible:ring-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs tracking-widest text-muted-foreground">DESCRIPTION</label>
                <Textarea name="description" required className="rounded-none border-primary/30 bg-black/50 focus-visible:ring-primary min-h-[150px]" placeholder="Detailed technical specification..." />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full rounded-none mt-2">
                {createMutation.isPending ? "SUBMITTING ON-CHAIN..." : "SUBMIT PROPOSAL"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="TOTAL PROPOSALS" value={stats?.totalProposals} loading={statsLoading} />
        <StatsCard title="ACTIVE" value={stats?.activeProposals} loading={statsLoading} valueClass="text-primary" />
        <StatsCard title="PASSED" value={stats?.passedProposals} loading={statsLoading} valueClass="text-green-400" />
        <StatsCard title="QUORUM" value={stats ? `${stats.quorumThreshold}%` : undefined} loading={statsLoading} />
      </div>

      <div className="mt-8">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4 rounded-none bg-background border border-primary/20 mb-6">
            <TabsTrigger value="all" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary">All</TabsTrigger>
            <TabsTrigger value="active" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Active</TabsTrigger>
            <TabsTrigger value="passed" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Passed</TabsTrigger>
            <TabsTrigger value="failed" className="rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Failed</TabsTrigger>
          </TabsList>
          
          {propsLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full bg-primary/5" />)}
            </div>
          ) : proposals?.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-primary/20 text-muted-foreground">
              No proposals found in this category.
            </div>
          ) : (
            <div className="space-y-4">
              {proposals?.map((proposal) => (
                <Link key={proposal.id} href={`/dao/${proposal.id}`}>
                  <Card className="border-primary/20 bg-card/50 hover:bg-card hover:border-primary/50 transition-all cursor-pointer rounded-none relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors"></div>
                    <CardHeader className="pb-2 flex flex-row items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-none border-primary/30 text-[10px] text-primary bg-primary/5 uppercase">
                            {proposal.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">ID: {proposal.id.toString().padStart(4, '0')}</span>
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">{proposal.title}</CardTitle>
                      </div>
                      <StatusBadge status={proposal.status} />
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-3xl">
                        {proposal.description}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 border-t border-border/50 mt-4 px-6 py-3 flex justify-between items-center text-xs font-mono text-muted-foreground">
                      <div>PROPOSER: {formatAddress(proposal.proposer)}</div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-green-400/80"><CheckCircle2 className="h-3 w-3" /> {proposal.votesFor}</span>
                        <span className="flex items-center gap-1 text-destructive/80"><XCircle className="h-3 w-3" /> {proposal.votesAgainst}</span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Tabs>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-primary/10 text-primary border-primary/30 animate-pulse",
    passed: "bg-green-500/10 text-green-400 border-green-500/30",
    failed: "bg-destructive/10 text-destructive border-destructive/30",
    pending: "bg-muted text-muted-foreground border-border",
    cancelled: "bg-muted text-muted-foreground border-border",
  };
  
  return (
    <Badge variant="outline" className={`rounded-none uppercase tracking-widest text-[10px] ${styles[status] || styles.pending}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 inline-block"></span>}
      {status}
    </Badge>
  );
}

function StatsCard({ title, value, loading, valueClass = "text-foreground" }: any) {
  return (
    <Card className="border-primary/20 bg-card/50 rounded-none text-center py-6 hover:bg-primary/5 transition-colors">
      {loading ? (
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-4 w-24 bg-primary/10" />
          <Skeleton className="h-8 w-16 bg-primary/10" />
        </div>
      ) : (
        <>
          <div className="text-[10px] tracking-widest text-muted-foreground mb-1">{title}</div>
          <div className={`text-3xl font-bold font-mono ${valueClass}`}>
            {value !== undefined ? value : "---"}
          </div>
        </>
      )}
    </Card>
  );
}