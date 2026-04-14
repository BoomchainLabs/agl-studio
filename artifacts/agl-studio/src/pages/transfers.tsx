import { useState } from "react";
import { useListTransfers, getListTransfersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, ExternalLink, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { formatAddress } from "@/lib/utils";

export default function Transfers() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput);
  };

  const { data: transfers, isLoading } = useListTransfers(
    { limit: 50, address: debouncedSearch || undefined }, 
    { query: { queryKey: getListTransfersQueryKey({ limit: 50, address: debouncedSearch || undefined }) } }
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase text-primary flex items-center gap-3">
            <ArrowRightLeft className="h-8 w-8" />
            Transfers Ledger
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time log of AGL token movements.</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex items-center w-full md:w-auto max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Filter by 0x address..." 
              className="w-full pl-9 bg-card border-primary/20 focus-visible:ring-primary rounded-none font-mono text-sm h-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="default" className="ml-2 rounded-none bg-primary text-primary-foreground hover:bg-primary/80 h-10">
            FILTER
          </Button>
        </form>
      </div>

      <Card className="border-primary/20 bg-card/50 rounded-none overflow-hidden">
        <CardHeader className="border-b border-primary/10 bg-card/50">
          <CardTitle className="text-sm font-bold tracking-widest uppercase text-primary">
            {debouncedSearch ? `Filtered Results for ${formatAddress(debouncedSearch)}` : 'Latest 50 Transfers'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-12 w-full bg-primary/5" />)}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-primary/5 border-b border-primary/10">
                  <tr>
                    <th className="px-6 py-3 font-bold tracking-widest">Time</th>
                    <th className="px-6 py-3 font-bold tracking-widest">From</th>
                    <th className="px-6 py-3 font-bold tracking-widest">To</th>
                    <th className="px-6 py-3 font-bold tracking-widest text-right">Amount (AGL)</th>
                    <th className="px-6 py-3 font-bold tracking-widest text-right">Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {transfers?.map((tx) => (
                    <tr key={tx.txHash} className={`hover:bg-primary/5 transition-colors ${tx.isBurn ? 'bg-destructive/5' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs">
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Pending'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <span className={tx.from.toLowerCase() === debouncedSearch.toLowerCase() ? 'text-primary font-bold' : ''}>
                          {formatAddress(tx.from)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs flex items-center gap-2">
                        <span className="text-primary/30">&rarr;</span>
                        <span className={tx.to.toLowerCase() === debouncedSearch.toLowerCase() ? 'text-primary font-bold' : tx.isBurn ? 'text-destructive font-bold' : ''}>
                          {tx.isBurn ? 'Burn Address' : formatAddress(tx.to)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.isBurn ? 'text-destructive' : 'text-foreground'}`}>
                        {tx.amountFormatted}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a 
                          href={`https://basescan.org/tx/${tx.txHash}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          {formatAddress(tx.txHash)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {!transfers?.length && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <ArrowRightLeft className="h-8 w-8 mb-2 opacity-20" />
                          <p>No transfers found.</p>
                          {debouncedSearch && <p className="text-xs mt-1">Try a different address filter.</p>}
                        </div>
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
