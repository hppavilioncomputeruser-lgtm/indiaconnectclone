import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import { useGetInquiry, useGetMe, getGetInquiryQueryKey, getGetMeQueryKey } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';

type Message = {
  id: number | string;
  sender_id: number;
  sender_role: 'buyer' | 'seller';
  body: string;
  created_at: string;
};

export default function InquiryChat() {
  const { id } = useParams<{ id: string }>();
  const inquiryId = Number(id);
  const { data: user, isLoading: userLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: inquiry, isLoading: inquiryLoading } = useGetInquiry(inquiryId, {
    query: { queryKey: getGetInquiryQueryKey(inquiryId), enabled: Number.isFinite(inquiryId) },
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const loadMessages = async () => {
    if (!Number.isFinite(inquiryId)) return;
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/messages`);
      if (!response.ok) throw new Error('Unable to load messages');
      setMessages(await response.json());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    void loadMessages();
    const interval = window.setInterval(() => void loadMessages(), 5000);
    return () => window.clearInterval(interval);
  }, [inquiryId]);

  const visibleMessages = useMemo(() => {
    if (!inquiry) return messages;
    const initial: Message = {
      id: `inquiry-${inquiry.id}`,
      sender_id: inquiry.buyer_id ?? 0,
      sender_role: 'buyer',
      body: inquiry.message,
      created_at: inquiry.created_at,
    };
    return [initial, ...messages];
  }, [inquiry, messages]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || isSending) return;
    setIsSending(true);
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send message');
      setMessages((current) => [...current, result]);
      setDraft('');
      setError('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (userLoading || inquiryLoading || !user || !inquiry) {
    return (
      <DashboardLayout role="buyer">
        <Skeleton className="h-96 rounded-xl" />
      </DashboardLayout>
    );
  }

  const role = user.role === 'seller' ? 'seller' : 'buyer';
  const backPath = role === 'seller' ? '/dashboard/seller/messages' : '/dashboard/buyer/messages';

  return (
    <DashboardLayout role={role}>
      <div className="max-w-3xl space-y-6">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href={backPath}><ArrowLeft className="h-4 w-4 mr-2" /> Back to messages</Link>
        </Button>

        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> {inquiry.listing_title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {role === 'seller' ? `Buyer: ${inquiry.buyer_name}` : `Supplier: ${inquiry.seller_name}`}
                </p>
              </div>
              <Badge variant="outline">{inquiry.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {isLoadingMessages ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-3/4 ml-auto" />
              </div>
            ) : (
              <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
                {visibleMessages.map((message) => {
                  const mine = message.sender_id === user.id || message.sender_role === role;
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                        <p className={`text-[11px] mt-2 ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {error && <p className="text-sm text-destructive mt-4">{error}</p>}
            <form onSubmit={sendMessage} className="flex gap-2 mt-6 pt-5 border-t border-border/50">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write a message..."
                className="min-h-12 resize-none"
                rows={2}
              />
              <Button type="submit" size="icon" className="shrink-0 self-end" disabled={isSending || !draft.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}