import { useGetAdminDashboard } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, Package, Wrench, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Admin Overview</h1>
            <p className="text-muted-foreground">Platform-wide statistics and metrics.</p>
          </div>
          
          {dashboard?.pending_sellers ? (
            <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-white">
              <Link href="/dashboard/admin/sellers">
                Review {dashboard.pending_sellers} Pending Sellers
              </Link>
            </Button>
          ) : null}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Users & Accounts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
                <p className="text-3xl font-display font-bold mt-2">{dashboard?.total_users}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Buyers</p>
                <p className="text-3xl font-display font-bold mt-2 text-primary">{dashboard?.total_buyers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Sellers</p>
                <p className="text-3xl font-display font-bold mt-2 text-secondary">{dashboard?.total_sellers}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-primary uppercase tracking-wider">Pending Sellers</p>
                <p className="text-3xl font-display font-bold mt-2 text-primary">{dashboard?.pending_sellers}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Listings
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Products</p>
                  <p className="text-3xl font-display font-bold mt-2">{dashboard?.total_products}</p>
                  <p className="text-sm text-muted-foreground mt-1">{dashboard?.active_products} Active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Services</p>
                  <p className="text-3xl font-display font-bold mt-2">{dashboard?.total_services}</p>
                  <p className="text-sm text-muted-foreground mt-1">{dashboard?.active_services} Active</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Seller Status
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Approved</p>
                  </div>
                  <p className="text-3xl font-display font-bold text-success">{dashboard?.approved_sellers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Rejected</p>
                  </div>
                  <p className="text-3xl font-display font-bold text-destructive">{dashboard?.rejected_sellers}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}