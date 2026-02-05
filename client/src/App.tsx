import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ClientsPage from "./pages/Clients";
import SuppliersPage from "./pages/Suppliers";
import FeesPage from "./pages/Fees";
import OperationsPage from "./pages/Operations";
import InvoicesPage from "./pages/Invoices";
import ProfitPage from "./pages/Profit";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Home />;
  }

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/suppliers" component={SuppliersPage} />
        <Route path="/fees" component={FeesPage} />
        <Route path="/operations" component={OperationsPage} />
        <Route path="/invoices" component={InvoicesPage} />
        <Route path="/profit" component={ProfitPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
