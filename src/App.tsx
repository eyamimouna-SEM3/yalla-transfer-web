import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ContactPage from "./pages/ContactPage";
import DashboardPage from "./pages/DashboardPage";
import AppPage from "./pages/AppPage";
import BookingPage from "./pages/BookingPage";
import VehicleSelectionPage from "./pages/VehicleSelectionPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReservations from "./pages/admin/AdminReservations";

import AdminPayments from "./pages/admin/AdminPayments";
import AdminReporting from "./pages/admin/AdminReporting";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminOffers from "./pages/admin/AdminOffers";
import AdminRouteGuard from "./components/admin/AdminRouteGuard";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/inscription" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/app" element={<AppPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/vehicles" element={<VehicleSelectionPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/admin" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
              <Route path="/admin/users" element={<AdminRouteGuard><AdminUsers /></AdminRouteGuard>} />
              <Route path="/admin/reservations" element={<AdminRouteGuard><AdminReservations /></AdminRouteGuard>} />
              <Route path="/admin/offers" element={<AdminRouteGuard><AdminOffers /></AdminRouteGuard>} />

              <Route path="/admin/payments" element={<AdminRouteGuard><AdminPayments /></AdminRouteGuard>} />
              <Route path="/admin/reporting" element={<AdminRouteGuard><AdminReporting /></AdminRouteGuard>} />
              <Route path="/admin/notifications" element={<AdminRouteGuard><AdminNotifications /></AdminRouteGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
