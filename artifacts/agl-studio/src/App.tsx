import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Burn from "@/pages/burn";
import Transfers from "@/pages/transfers";
import Wallet from "@/pages/wallet";
import About from "@/pages/about";
import Indexer from "@/pages/indexer";
import AiAnalyst from "@/pages/ai";
import Staking from "@/pages/staking";
import DaoGovernance from "@/pages/dao";
import DaoProposalView from "@/pages/dao-proposal";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/burn" component={Burn} />
        <Route path="/transfers" component={Transfers} />
        <Route path="/wallet" component={Wallet} />
        <Route path="/indexer" component={Indexer} />
        <Route path="/ai" component={AiAnalyst} />
        <Route path="/staking" component={Staking} />
        <Route path="/dao" component={DaoGovernance} />
        <Route path="/dao/:id" component={DaoProposalView} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
