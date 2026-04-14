import { useParams, Link } from "wouter";
import { useGetDaoProposal, getGetDaoProposalQueryKey, useCastDaoVote } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, User } from "lucide-react";
import { formatAddress } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function DaoProposalView() {
  const { id } = useParams<{ id: string }>();
  const proposalId = parseInt(id || "0", 10);
  
  const { data: proposal, isLoading } = useGetDaoProposal(proposalId, { 
    query: { enabled: !!proposalId, queryKey: getGetDaoProposalQueryKey(proposalId) } 
  });
  
  const voteMutation = useCastDaoVote();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mockVotingPower] = useState(() => (Math.floor(Math.random() * 50000) + 1000).toString());

  const handleVote = async (choice: 'for' | 'against' | 'abstain') => {
    try {
      await voteMutation.mutateAsync({
        id: proposalId,
        data: {
          voter: "0x" + Math.random().toString(16).slice(2, 42), // Mock user
          voteChoice: choice,
          votingPower: mockVotingPower
        }
      });
      toast({ title: "Vote Cast", description: `Successfully voted ${choice.toUpperCase()}` });
      queryClient.invalidateQueries({ queryKey: getGetDaoProposalQueryKey(proposalId) });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Voting Failed", description: err.message });
    }
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-12 w-1/3 bg-primary/10" /><Skeleton className="h-64 w-full bg-primary/5" /></div>;
  }

  if (!proposal) {
    return <div className="text-center py-20 text-muted-foreground">Proposal not found</div>;
  }

  const total = proposal.totalVotes || 1; // Prevent div by zero in UI
  const pFor = (Number(proposal.votesFor) / total) * 100;
  const pAgainst = (Number(proposal.votesAgainst) / total) * 100;
  const pAbstain = (Number(proposal.votesAbstain) / total) * 100;

  const isActive = proposal.status === 'active';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/dao" className="inline-flex items-center text-xs text-primary hover:underline uppercase tracking-widest font-mono">
        <ArrowLeft className="mr-2 h-3 w-3" /> Back to Governance
      </Link>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 space-y-6 w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="rounded-none border-primary/30 text-primary bg-primary/5 uppercase text-xs">
                AIP-{proposal.id}
              </Badge>
              <Badge variant="outline" className="rounded-none border-border uppercase text-xs">
                {proposal.category}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">{proposal.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-card/50 p-2 border border-border inline-flex">
              <User className="h-4 w-4" /> Proposer: {formatAddress(proposal.proposer)}
            </div>
          </div>

          <Card className="border-primary/20 bg-card/50 rounded-none">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm tracking-widest uppercase">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {proposal.description}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-80 space-y-6 shrink-0">
          <Card className="border-primary/20 bg-card/50 rounded-none">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm tracking-widest uppercase flex justify-between items-center">
                Status
                <Badge variant="outline" className={`rounded-none uppercase ${isActive ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>
                  {proposal.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start</span>
                <span>{new Date(proposal.startTime).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End</span>
                <span>{new Date(proposal.endTime).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/50 rounded-none">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm tracking-widest uppercase">Current Results</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-green-400 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> For</span>
                  <span>{proposal.votesFor} ({pFor.toFixed(1)}%)</span>
                </div>
                <Progress value={pFor} className="h-2 rounded-none bg-border [&>div]:bg-green-400" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-destructive flex items-center gap-2"><XCircle className="h-4 w-4" /> Against</span>
                  <span>{proposal.votesAgainst} ({pAgainst.toFixed(1)}%)</span>
                </div>
                <Progress value={pAgainst} className="h-2 rounded-none bg-border [&>div]:bg-destructive" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-muted-foreground flex items-center gap-2"><MinusCircle className="h-4 w-4" /> Abstain</span>
                  <span>{proposal.votesAbstain} ({pAbstain.toFixed(1)}%)</span>
                </div>
                <Progress value={pAbstain} className="h-2 rounded-none bg-border [&>div]:bg-muted-foreground" />
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-between text-sm font-mono text-muted-foreground">
                <span>Quorum</span>
                <span className={proposal.quorumReached ? 'text-primary' : ''}>
                  {proposal.quorumReached ? 'Reached' : 'Not Reached'}
                </span>
              </div>
            </CardContent>
          </Card>

          {isActive && (
            <Card className="border-primary bg-primary/5 rounded-none shadow-[0_0_15px_rgba(0,255,255,0.1)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm tracking-widest uppercase text-primary">Cast Your Vote</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="text-xs font-mono text-muted-foreground mb-2">Voting Power: <span className="text-primary">{mockVotingPower} AGL</span></div>
                <Button 
                  onClick={() => handleVote('for')} 
                  disabled={voteMutation.isPending}
                  className="w-full rounded-none bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50"
                >
                  VOTE FOR
                </Button>
                <Button 
                  onClick={() => handleVote('against')} 
                  disabled={voteMutation.isPending}
                  className="w-full rounded-none bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/50"
                >
                  VOTE AGAINST
                </Button>
                <Button 
                  onClick={() => handleVote('abstain')} 
                  disabled={voteMutation.isPending}
                  variant="outline"
                  className="w-full rounded-none border-border"
                >
                  ABSTAIN
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}