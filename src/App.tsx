import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Results from "./pages/Results";
import DateResults from "./pages/DateResults";
import Auth from "./pages/Auth";
import Console from "./pages/Console";
import MatchDetail from "./pages/MatchDetail";
import { SportPage } from "./pages/SportPage";
import Pricing from "./pages/Pricing";
import PaymentCallback from "./pages/PaymentCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/football" element={<SportPage sport="football" title="Football" emoji="⚽" />} />
              <Route path="/basketball" element={<SportPage sport="basketball" title="Basketball" emoji="🏀" />} />
              <Route path="/tennis" element={<SportPage sport="tennis" title="Tennis" emoji="🎾" />} />
              <Route path="/results" element={<Results />} />
              <Route path="/date/:date" element={<DateResults />} />
              <Route path="/match/:id" element={<MatchDetail />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              <Route path="/console" element={<Console />} />
              <Route path="/console/:token" element={<Console />} />
              <Route path="/elorahenry" element={<Console />} />
            </Route>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
