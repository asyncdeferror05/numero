import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import { DashboardPage } from "@/pages/dashboard";
import { RulesPage } from "@/pages/rules";
import { FormulasPage } from "@/pages/formulas";
import { KnowledgePage } from "@/pages/knowledge";
import { LoShuPage } from "@/pages/lo-shu";
import { ReportsPage } from "@/pages/reports";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/rules" component={RulesPage} />
        <Route path="/formulas" component={FormulasPage} />
        <Route path="/knowledge" component={KnowledgePage} />
        <Route path="/lo-shu" component={LoShuPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
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
