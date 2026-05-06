import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/lib/AppContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { FieldSettingsProvider } from "@/lib/FieldSettingsContext";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import AppLayout from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Expenses from "./pages/Expenses";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound.tsx";
import { PermKey } from "./lib/AuthContext";

const queryClient = new QueryClient();

function Guard({ perm, children }: { perm: PermKey; children: JSX.Element }) {
  const { has } = useAuth();
  if (!has(perm)) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { has } = useAuth();
  const order: { perm: PermKey; path: string }[] = [
    { perm: "module.dashboard", path: "/dashboard" },
    { perm: "module.bookings", path: "/bookings" },
    { perm: "module.expenses", path: "/expenses" },
    { perm: "module.customers", path: "/customers" },
    { perm: "module.settings", path: "/settings" },
  ];
  const target = order.find((o) => has(o.perm));
  return <Navigate to={target?.path || "/dashboard"} replace />;
}

function AppRoutes() {
  const { user, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (!user) return <Login />;
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<Guard perm="module.dashboard"><Dashboard /></Guard>} />
          <Route path="/bookings" element={<Guard perm="module.bookings"><Bookings /></Guard>} />
          <Route path="/expenses" element={<Guard perm="module.expenses"><Expenses /></Guard>} />
          <Route path="/customers" element={<Guard perm="module.customers"><Customers /></Guard>} />
          <Route path="/settings" element={<Guard perm="module.settings"><Settings /></Guard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { loading: globalLoading } = useApp();
  
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {showSplash && <SplashScreen />}
      <LoadingOverlay show={globalLoading.show} message={globalLoading.message} />
      <AppRoutes />
    </TooltipProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeProvider>
          <FieldSettingsProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </FieldSettingsProvider>
        </ThemeProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
