import { lazy, Suspense } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { BaseLayout } from '@/components/layout/BaseLayout';
import NotFound from '@/pages/not-found';

// Lazy load pages for better performance
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const RegisterBuyer = lazy(() => import('@/pages/RegisterBuyer'));
const RegisterSeller = lazy(() => import('@/pages/RegisterSeller'));

const Products = lazy(() => import('@/pages/Products'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Services = lazy(() => import('@/pages/Services'));
const ServiceDetail = lazy(() => import('@/pages/ServiceDetail'));
const Sellers = lazy(() => import('@/pages/Sellers'));
const SellerDetail = lazy(() => import('@/pages/SellerDetail'));

const BuyerDashboard = lazy(() => import('@/pages/dashboard/BuyerDashboard'));
const SellerDashboard = lazy(() => import('@/pages/dashboard/SellerDashboard'));
const AdminDashboard = lazy(() => import('@/pages/dashboard/AdminDashboard'));
const AdminSellers = lazy(() => import('@/pages/dashboard/AdminSellers'));

const SellerProducts = lazy(() => import('@/pages/dashboard/SellerProducts'));
const SellerServices = lazy(() => import('@/pages/dashboard/SellerServices'));
const SellerProductForm = lazy(() => import('@/pages/dashboard/SellerProductForm'));
const SellerServiceForm = lazy(() => import('@/pages/dashboard/SellerServiceForm'));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<BaseLayout><LoadingFallback /></BaseLayout>}>
      <Switch>
        {/* Public Routes with Base Layout */}
        <Route path="/">
          <BaseLayout><Home /></BaseLayout>
        </Route>
        <Route path="/login">
          <BaseLayout><Login /></BaseLayout>
        </Route>
        <Route path="/register/buyer">
          <BaseLayout><RegisterBuyer /></BaseLayout>
        </Route>
        <Route path="/register/seller">
          <BaseLayout><RegisterSeller /></BaseLayout>
        </Route>
        <Route path="/products">
          <BaseLayout><Products /></BaseLayout>
        </Route>
        <Route path="/products/:id">
          <BaseLayout><ProductDetail /></BaseLayout>
        </Route>
        <Route path="/services">
          <BaseLayout><Services /></BaseLayout>
        </Route>
        <Route path="/services/:id">
          <BaseLayout><ServiceDetail /></BaseLayout>
        </Route>
        <Route path="/sellers">
          <BaseLayout><Sellers /></BaseLayout>
        </Route>
        <Route path="/sellers/:id">
          <BaseLayout><SellerDetail /></BaseLayout>
        </Route>

        {/* Dashboard Routes (DashboardLayout is handled inside the page components) */}
        <Route path="/dashboard/buyer">
          <BuyerDashboard />
        </Route>
        <Route path="/dashboard/seller">
          <SellerDashboard />
        </Route>
        <Route path="/dashboard/seller/products">
          <SellerProducts />
        </Route>
        <Route path="/dashboard/seller/services">
          <SellerServices />
        </Route>
        <Route path="/dashboard/seller/products/new">
          <SellerProductForm />
        </Route>
        <Route path="/dashboard/seller/products/:id/edit">
          <SellerProductForm />
        </Route>
        <Route path="/dashboard/seller/services/new">
          <SellerServiceForm />
        </Route>
        <Route path="/dashboard/seller/services/:id/edit">
          <SellerServiceForm />
        </Route>
        <Route path="/dashboard/admin">
          <AdminDashboard />
        </Route>
        <Route path="/dashboard/admin/sellers">
          <AdminSellers />
        </Route>

        {/* 404 */}
        <Route>
          <BaseLayout><NotFound /></BaseLayout>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;