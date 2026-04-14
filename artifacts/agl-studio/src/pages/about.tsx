import { useGetTokenInfo, getGetTokenInfoQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Copy, ExternalLink, ShieldCheck, Zap, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function About() {
  const { data: info, isLoading } = useGetTokenInfo({ query: { queryKey: getGetTokenInfoQueryKey() } });
  const { toast } = useToast();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Contract address copied successfully.",
      duration: 2000,
    });
  };

  const contractAddress = "0xEA1221B4d80A89BD8C75248Fae7c176BD1854698";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b border-border/50 pb-6 mb-8 text-center pt-8">
        <h1 className="text-4xl font-bold tracking-tighter uppercase text-primary mb-4 glow-text">Agunnaya Labs</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          The definitive data layer for the AGL token ecosystem. Built on Base, engineered for transparency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20 bg-card/50 rounded-none text-center p-6">
          <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="font-bold tracking-widest uppercase mb-2">Immutable</h3>
          <p className="text-sm text-muted-foreground">Clean ERC-20 implementation. No mint function. No hidden taxes or honeypot mechanics.</p>
        </Card>
        <Card className="border-primary/20 bg-card/50 rounded-none text-center p-6">
          <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="font-bold tracking-widest uppercase mb-2">Base Native</h3>
          <p className="text-sm text-muted-foreground">Deployed exclusively on the Base L2 network for lightning-fast, low-cost execution.</p>
        </Card>
        <Card className="border-destructive/40 bg-card/50 rounded-none text-center p-6">
          <Flame className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h3 className="font-bold tracking-widest uppercase mb-2 text-destructive">Deflationary</h3>
          <p className="text-sm text-muted-foreground">Fixed initial supply of 1B tokens with a verifiable burn mechanism reducing circulating supply.</p>
        </Card>
      </div>

      <Card className="border-primary/30 bg-card rounded-none mt-12 overflow-hidden shadow-xl shadow-primary/5">
        <div className="bg-primary/10 border-b border-primary/20 p-6 flex items-center gap-3">
          <Info className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold tracking-widest uppercase">Contract Protocol Data</h2>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            <DataRow label="Network" value={info?.chainName || "Base Mainnet"} loading={isLoading} />
            <DataRow label="Chain ID" value={info?.chainId?.toString() || "8453"} loading={isLoading} />
            <DataRow label="Token Name" value={info?.name || "Agunnaya Labs"} loading={isLoading} />
            <DataRow label="Ticker Symbol" value={info?.symbol || "AGL"} loading={isLoading} />
            <DataRow label="Decimals" value={info?.decimals?.toString() || "18"} loading={isLoading} />
            <DataRow label="Initial Supply" value="1,000,000,000 AGL" loading={false} />
            
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/30">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">Contract Address</span>
                <span className="font-mono text-sm break-all text-primary">{contractAddress}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleCopy(contractAddress)}
                  className="flex items-center justify-center h-10 w-10 bg-card border border-primary/30 hover:bg-primary/20 transition-colors text-primary"
                  title="Copy Address"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a 
                  href={`https://basescan.org/token/${contractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/80 font-bold text-xs tracking-widest uppercase transition-colors"
                >
                  View on Basescan
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DataRow({ label, value, loading }: { label: string, value?: string, loading: boolean }) {
  return (
    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-primary/5 transition-colors">
      <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">{label}</span>
      {loading ? (
        <Skeleton className="h-6 w-32 bg-primary/10" />
      ) : (
        <span className="font-mono text-sm text-foreground">{value}</span>
      )}
    </div>
  );
}

import { Flame } from "lucide-react";