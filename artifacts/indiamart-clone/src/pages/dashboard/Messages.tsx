import { Link } from 'wouter';
import { useListInquiries } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, ArrowRight, Inbox } from 'lucide-react';

export default function Messages() {
  const { data, isLoading } = useListInquiries({ page: 1, limit: 100 });
  const inquiries = data?.items ?? [];

  return (
    <DashboardLayout role="buyer">
      <MessagesContent inquiries={inquiries} isLoading={isLoading} />
    </DashboardLayout>
  );
}

export function SellerMessages() {
  const { data, isLoading } = useListInquiries({ page: 1, limit: 100 });
  const inquiries = data?.items ?? [];

  return (
    <DashboardLayout role="seller">
      <MessagesContent inquiries={inquiries} isLoading={isLoading} sellerView />
    </DashboardLayout>
  );
}

function MessagesContent({
  inquiries,
  isLoading,
  sellerView = false,
}: {
  inquiries: Array<any>;
  isLoading: boolean;
  sellerView?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Messages</h1>
        <p className="text-muted-foreground">
          {sellerView ? 'Chat with buyers about your listings.' : 'Chat with suppliers about your inquiries.'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
        </div>
      ) : inquiries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-bold mb-2">No conversations yet</h2>
            <p className="text-muted-foreground">
              {sellerView ? 'Buyer inquiries will appear here.' : 'Your product and service inquiries will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="border-border/50 hover:border-primary/40 transition-colors">
              <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center mb-1">
                    <h2 className="font-bold truncate">{inquiry.listing_title}</h2>
                    <Badge variant="outline">{inquiry.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sellerView ? `From ${inquiry.buyer_name}` : `With ${inquiry.seller_name}`}
                    <span className="mx-2">•</span>
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm mt-2 line-clamp-1">{inquiry.message}</p>
                </div>
                <Button asChild variant="outline" className="shrink-0">
                  <Link href={`/dashboard/chat/${inquiry.id}`}>
                    Open chat <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}