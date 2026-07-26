import { useState } from 'react';
import { useListAdminSellers, useApproveSeller, useRejectSeller } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getListAdminSellersQueryKey, getGetAdminDashboardQueryKey } from '@workspace/api-client-react';
import { CheckCircle2, XCircle, Building2, MapPin } from 'lucide-react';

export default function AdminSellers() {
  const [statusTab, setStatusTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sellersData, isLoading } = useListAdminSellers({
    status: statusTab,
    page,
    limit: 10
  });

  const approveMutation = useApproveSeller();
  const rejectMutation = useRejectSeller();

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const refreshQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListAdminSellersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Seller Approved', description: 'The seller can now publish listings.' });
        refreshQueries();
      },
      onError: (err: any) => {
        toast({ title: 'Failed to approve', description: err.error, variant: 'destructive' });
      }
    });
  };

  const handleReject = () => {
    if (!rejectingId || !rejectionReason.trim()) return;

    rejectMutation.mutate({ 
      id: rejectingId, 
      data: { reason: rejectionReason } 
    }, {
      onSuccess: () => {
        toast({ title: 'Seller Rejected' });
        refreshQueries();
        setRejectingId(null);
        setRejectionReason('');
      },
      onError: (err: any) => {
        toast({ title: 'Failed to reject', description: err.error, variant: 'destructive' });
      }
    });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Seller Approvals</h1>
          <p className="text-muted-foreground">Review and manage seller registrations (KYC verification).</p>
        </div>

        <Tabs value={statusTab} onValueChange={(v) => { setStatusTab(v as any); setPage(1); }} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
              </div>
            ) : sellersData?.items.length === 0 ? (
              <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
                <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">No sellers found</h3>
                <p className="text-muted-foreground">There are no sellers in the '{statusTab}' queue.</p>
              </div>
            ) : (
              sellersData?.items.map((seller) => (
                <Card key={seller.id} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-xl">{seller.business_name}</h3>
                            <Badge variant="outline" className={
                              statusTab === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                              statusTab === 'approved' ? 'bg-success/10 text-success border-success/20' :
                              'bg-destructive/10 text-destructive border-destructive/20'
                            }>
                              {seller.verification_status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Owner: {seller.user_name} • {seller.user_email}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-3 rounded-lg border border-border/50">
                          <div>
                            <p className="text-muted-foreground text-xs uppercase font-medium">Location</p>
                            <p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {seller.city}, {seller.state}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase font-medium">GSTIN</p>
                            <p className="font-mono font-medium">{seller.gst_number}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase font-medium">Products</p>
                            <p className="font-medium">{seller.product_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase font-medium">Services</p>
                            <p className="font-medium">{seller.service_count}</p>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex md:flex-col gap-2 items-center md:items-end justify-center">
                        {statusTab === 'pending' && (
                          <>
                            <Button 
                              onClick={() => handleApprove(seller.id)}
                              className="bg-success hover:bg-success/90 text-success-foreground w-full md:w-32"
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => setRejectingId(seller.id)}
                              className="w-full md:w-32"
                            >
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </Button>
                          </>
                        )}
                        {statusTab === 'approved' && (
                          <Button variant="outline" className="w-full md:w-32" onClick={() => setRejectingId(seller.id)}>
                            Revoke Status
                          </Button>
                        )}
                        {statusTab === 'rejected' && (
                          <Button variant="outline" className="w-full md:w-32" onClick={() => handleApprove(seller.id)}>
                            Re-evaluate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {sellersData && sellersData.total_pages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" disabled={page === sellersData.total_pages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </Tabs>

        {/* Rejection Dialog */}
        <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Seller Verification</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this seller. This will be shown to the seller so they can correct it.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                placeholder="e.g. Invalid GST format, Name does not match Aadhaar..." 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim() || rejectMutation.isPending}>
                {rejectMutation.isPending ? 'Processing...' : 'Confirm Rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}