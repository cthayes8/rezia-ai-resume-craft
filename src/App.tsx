
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GetStarted from "./pages/GetStarted";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import DashboardMain from "./pages/dashboard/DashboardMain";
import DashboardHistory from "./pages/dashboard/DashboardHistory";
import DashboardAccount from "./pages/dashboard/DashboardAccount";
import DashboardLoading from "./pages/dashboard/DashboardLoading";
import DashboardResults from "./pages/dashboard/DashboardResults";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/signin" element={<SignIn />} />
          
          {/* Dashboard routes */}
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardMain />} />
            <Route path="history" element={<DashboardHistory />} />
            <Route path="account" element={<DashboardAccount />} />
            <Route path="optimize/loading" element={<DashboardLoading />} />
            <Route path="optimize/results" element={<DashboardResults />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
