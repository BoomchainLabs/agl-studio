import { useState, useEffect } from "react";
import { useGetTokenBalance, getGetTokenBalanceQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, Search, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Wallet() {
  const [inputAddress, setInputAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [isValid, setIsValid] = useState(true);

  const validateAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAddress) {
      setSearchAddress("");
      setIsValid(true);
      return;
    }
    
    if (validateAddress(inputAddress)) {
      setSearchAddress(inputAddress);
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  const { data: balance, isLoading, isError } = useGetTokenBalance(
    searchAddress,
    { 
      query: { 
        enabled: !!searchAddress && validateAddress(searchAddress),
        queryKey: getGetTokenBalanceQueryKey(searchAddress),
        retry: false
      } 
    }
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl mx-auto pt-10">
      <div className="text-center space-y-4 mb-10">
        <div className="mx-auto h-16 w-16 rounded-none bg-primary/10 flex items-center justify-center border border-primary/30 text-primary">
          <WalletIcon className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight uppercase text-primary">Wallet Lookup</h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Query the Base blockchain directly to retrieve the AGL token balance for any valid 0x address.
        </p>
      </div>

      <Card className="border-primary/20 bg-card/50 rounded-none shadow-2xl shadow-primary/5">
        <CardContent className="p-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="address" className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Target Wallet Address
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="address"
                    type="text" 
                    placeholder="0x..." 
                    className={`w-full pl-10 bg-background/50 focus-visible:ring-primary rounded-none font-mono text-base h-12 ${!isValid ? 'border-destructive focus-visible:ring-destructive' : 'border-primary/30'}`}
                    value={inputAddress}
                    onChange={(e) => {
                      setInputAddress(e.target.value);
                      if (!isValid) setIsValid(true);
                    }}
                  />
                </div>
                <Button type="submit" size="lg" className="rounded-none bg-primary text-primary-foreground hover:bg-primary/80 h-12 px-8 font-bold tracking-wider">
                  QUERY
                </Button>
              </div>
              {!isValid && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3 w-3" />
                  Invalid Ethereum/Base address format. Must be 42 characters starting with 0x.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {searchAddress && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
          <Card className={`border ${isError ? 'border-destructive/30' : 'border-primary/30'} bg-card rounded-none overflow-hidden`}>
            <div className={`h-1 w-full ${isError ? 'bg-destructive' : 'bg-primary'}`} />
            <CardHeader className="border-b border-border/50 bg-background/50">
              <CardTitle className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Query Result</CardTitle>
              <CardDescription className="font-mono text-xs break-all text-foreground">{searchAddress}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              {isLoading ? (
                <div className="space-y-4 flex flex-col items-center">
                  <Skeleton className="h-16 w-64 bg-primary/10" />
                  <Skeleton className="h-4 w-32 bg-primary/5" />
                </div>
              ) : isError ? (
                <div className="text-destructive space-y-2 flex flex-col items-center">
                  <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                  <p className="font-bold text-lg">Query Failed</p>
                  <p className="text-sm opacity-80">Unable to retrieve balance for this address. It may not exist on Base.</p>
                </div>
              ) : balance ? (
                <div className="space-y-2">
                  <div className="text-5xl md:text-6xl font-bold tracking-tighter text-primary glow-text">
                    {balance.balanceFormatted}
                  </div>
                  <div className="text-xl text-muted-foreground font-bold tracking-widest">{balance.symbol}</div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
