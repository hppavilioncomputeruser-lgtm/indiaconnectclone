import { useGetBuyerDashboard } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Clock, CheckCircle2, Package, Link as LinkIcon } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function BuyerDashboard() {
  const { data: dashboard, isLoading } = useGetBuyerDashboard();

  if (isLoading) {
    return (
      <DashboardLayout role="buyer">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="buyer">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your sourcing inquiries and responses.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Inquiries</p>
                  <p className="text-3xl font-display font-bold">{dashboard?.total_inquiries || 0}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
                  <p className="text-3xl font-display font-bold">{dashboard?.pending_inquiries || 0}</p>
                </div>
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Responded</p>
                  <p className="text-3xl font-display font-bold">{dashboard?.responded_inquiries || 0}</p>
                </div>
                <div className="p-2 bg-success/10 rounded-lg text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Closed</p>
                  <p className="text-3xl font-display font-bold">{dashboard?.closed_inquiries || 0}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                  <Package className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Inquiries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            {!dashboard?.recent_inquiries || dashboard.recent_inquiries.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">No inquiries yet</h3>
                <p className="text-muted-foreground mb-6">Start exploring products and services to request quotes.</p>
                <div className="flex justify-center gap-4">
                  <Button asChild><Link href="/products">Browse Products</Link></Button>
                  <Button variant="outline" asChild><Link href="/services">Browse Services</Link></Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">Date</th>
                      <th className="px-4 py-3 font-medium">Item/Service</th>
                      <th className="px-4 py-3 font-medium">Supplier</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium rounded-tr-lg">Seller Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {dashboard.recent_inquiries.map((inquiry) => (
                      <tr key={inquiry.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          {new Date(inquiry.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <Link 
                            href={inquiry.listing_type === 'product' ? `/products/${inquiry.product_id}` : `/services/${inquiry.service_id}`}
                            className="font-medium hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            {inquiry.listing_title}
                            <LinkIcon className="h-3 w-3 text-muted-foreground" />
                          </Link>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{inquiry.message}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Link href={`/sellers/${inquiry.seller_id}`} className="hover:text-primary transition-colors">
                            {inquiry.seller_name}
                          </Link>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={
                            inquiry.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                            inquiry.status === 'responded' ? 'bg-success/10 text-success border-success/20' :
                            'bg-muted text-muted-foreground'
                          }>
                            {inquiry.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 max-w-[200px]">
                          {inquiry.seller_response ? (
                            <span className="line-clamp-2 text-sm text-foreground">{inquiry.seller_response}</span>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Waiting for response</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}