import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderTracking from "./pages/OrderTracking";
import AdminAccess from "./pages/AdminAccess";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NossaHistoria from "./pages/NossaHistoria";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";
import { CartProvider } from "./lib/cart";
import { CookieConsent } from "./components/CookieConsent";
import { AnalyticsScripts } from "./components/AnalyticsScripts";
import RiderPortal from "./pages/RiderPortal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={CustomerLogin} />
      <Route path="/cadastro" component={CustomerRegister} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order/:id" component={OrderSuccess} />
      <Route path="/acompanhar/:id" component={OrderTracking} />
      <Route path="/nossa-historia" component={NossaHistoria} />
      <Route path="/moto" component={RiderPortal} />
      <Route path="/painel/acesso/:token" component={AdminAccess} />
      <Route path="/painel/login" component={AdminLogin} />
      <Route path="/painel" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <AnalyticsScripts />
          <Router />
          <CookieConsent />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
