import { useGetSellerDashboard, useGetMe, useUpdateInquiry } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Package, Wrench, MessageSquare, Plus, CheckCircle2, AlertCircle, InfoIcon } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSellerDashboardQueryKey } from '@workspace/api-client-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function SellerDashboard() {
  const { data: user } = useGetMe();
  const { data: dashboard, isLoading } = useGetSellerDashboard();
  const updateInquiry = useUpdateInquiry();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [respondingTo, setRespondingTo] = useState<any | null>(null);
  const [responseText, setResponseText] = useState('');

  if (isLoading || !user) {
    return (
      <DashboardLayout role="seller">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const profile = user.seller_profile;

  const handleRespond = () => {
    if (!respondingTo || !responseText.trim()) return;

    updateInquiry.mutate({
      id: respondingTo.id,
      data: {
        status: 'responded',
        seller_response: responseText
      }
    }, {
      onSuccess: () => {
        toast({ title: 'Response sent successfully' });
        queryClient.invalidateQueries({ queryKey: getGetSellerDashboardQueryKey() });
        setRespondingTo(null);
        setResponseText('');
      },
      onError: (err: any) => {
        toast({ title: 'Failed to send response', description: err.error, variant: 'destructive' });
      }
    });
  };

  return (
    <DashboardLayout role="seller">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Seller Dashboard</h1>
            <p className="text-muted-foreground">Manage your business profile, listings, and inquiries.</p>
          </div>
          
          {profile?.verification_status === 'approved' && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/seller/services/new"><Plus className="h-4 w-4 mr-2" /> Add Service</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/seller/products/new"><Plus className="h-4 w-4 mr-2" /> Add Product</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Verification Status Banner */}
        {profile?.verification_status === 'pending' && (
          <Alert className="bg-yellow-500/10 border-yellow-500/50 text-yellow-800 dark:text-yellow-500">
            <InfoIcon className="h-5 w-5" />
            <AlertTitle className="font-bold">Account Verification Pending</AlertTitle>
            <AlertDescription>
              Your account is currently under review by our admin team. You can set up your profile, but your listings will not be visible to buyers until approved. Verification usually takes 24-48 hours.
            </AlertDescription>
          </Alert>
        )}

        {profile?.verification_status === 'rejected' && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-bold">Verification Rejected</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Your seller registration was rejected for the following reason:</p>
              <div className="bg-destructive/10 p-3 rounded-md font-medium">
                {profile.rejection_reason || 'No reason provided. Please contact support.'}
              </div>
              <p className="text-sm opacity-90 mt-2">Please update your business details and re-submit, or contact support for assistance.</p>
            </AlertDescription>
          </Alert>
        )}

        {profile?.verification_status === 'approved' && (
          <Alert className="bg-success/10 border-success/30 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <AlertTitle className="font-bold">Account Approved</AlertTitle>
            <AlertDescription>
              Your seller account is active. Your listings are visible to millions of buyers on IndiaConnect.
            </AlertDescription>
          </Alert>
        )}

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
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Response</p>
                  <p className="text-3xl font-display font-bold text-yellow-600 dark:text-yellow-500">{dashboard?.pending_inquiries || 0}</p>
                </div>
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Products</p>
                  <p className="text-3xl font-display font-bold">{dashboard?.active_products || 0} <span className="text-sm text-muted-foreground font-normal">/ {dashboard?.total_products || 0}</span></p>
                </div>
                <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                  <Package className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Services</p>
                  <p className="text-3xl font-display font-bold">{dashboard?.active_services || 0} <span className="text-sm text-muted-foreground font-normal">/ {dashboard?.total_services || 0}</span></p>
                </div>
                <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                  <Wrench className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Inquiries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Buyer Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            {!dashboard?.recent_inquiries || dashboard.recent_inquiries.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">No inquiries yet</h3>
                <p className="text-muted-foreground">When buyers contact you, their messages will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.recent_inquiries.map((inquiry) => (
                  <div key={inquiry.id} className={`p-4 rounded-xl border ${inquiry.status === 'pending' ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-card'}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={
                            inquiry.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                            'bg-success/10 text-success border-success/20'
                          }>
                            {inquiry.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{new Date(inquiry.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <h4 className="font-bold text-lg">Inquiry for {inquiry.listing_title}</h4>
                        
                        <div className="p-3 bg-background rounded-lg border border-border/50 text-sm">
                          <p className="font-medium mb-1">Buyer: {inquiry.buyer_name}</p>
                           <p className="text-muted-foreground mb-3">{inquiry.buyer_email || inquiry.buyer_phone || 'Contact available in chat'}</p>
                          <p className="italic">"{inquiry.message}"</p>
                          
                          {(inquiry.quantity || inquiry.budget) && (
                            <div className="mt-3 flex gap-4 text-xs font-medium text-muted-foreground border-t border-border/50 pt-2">
                              {inquiry.quantity && <span>Qty: {inquiry.quantity}</span>}
                              {inquiry.budget && <span>Budget: ₹{inquiry.budget}</span>}
                            </div>
                          )}
                        </div>

                        {inquiry.status === 'responded' && inquiry.seller_response && (
                          <div className="mt-2 pl-4 border-l-2 border-success/30 text-sm">
                            <span className="font-medium text-success">Your Response:</span> {inquiry.seller_response}
                          </div>
                        )}
                      </div>
                      
                      <div className="shrink-0 flex items-start">
                        {inquiry.status === 'pending' && (
                          <Button onClick={() => setRespondingTo(inquiry)}>
                            Respond Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Dialog */}
      <Dialog open={!!respondingTo} onOpenChange={(open) => !open && setRespondingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Inquiry</DialogTitle>
            <DialogDescription>
              Send a message to {respondingTo?.buyer_name}. This will update the inquiry status.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea 
              placeholder="Type your response, quote, or next steps..." 
              className="min-h-[150px]"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingTo(null)}>Cancel</Button>
            <Button onClick={handleRespond} disabled={!responseText.trim() || updateInquiry.isPending}>
              {updateInquiry.isPending ? 'Sending...' : 'Send Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}