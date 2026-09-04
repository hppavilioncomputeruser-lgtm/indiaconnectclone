import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useGetMe, useListCategories } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Send, MessageSquare, IndianRupee, RefreshCw, X } from 'lucide-react';

type Broadcast = {
  id: number;
  buyer_id: number;
  buyer_name: string;
  category_id: number | null;
  category_name: string | null;
  title: string;
  description: string;
  quantity: string | null;
  unit: string | null;
  budget: number | null;
  deadline: string | null;
  status: 'open' | 'closed';
  response_count: number;
  created_at: string;
  responses?: Array<{
    id: number;
    seller_business_name: string;
    message: string;
    price_offer: number | null;
    created_at: string;
  }>;
};

export default function Broadcasts({ role }: { role: 'buyer' | 'seller' }) {
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: categories } = useListCategories();
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isResponding, setIsResponding] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [responseDraft, setResponseDraft] = useState({ message: '', price_offer: '' });
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    quantity: '',
    unit: '',
    budget: '',
    deadline: '',
  });

  const loadBroadcasts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/broadcasts?limit=100');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load requirements');
      setBroadcasts(result.items ?? []);
    } catch (error) {
      toast({ title: 'Could not load requirements', description: error instanceof Error ? error.message : 'Please try again', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBroadcasts();
  }, []);

  const createBroadcast = async (event: FormEvent) => {
    event.preventDefault();
    setIsCreating(true);
    try {
      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category_id: form.category_id || undefined,
          budget: form.budget || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to post requirement');
      setBroadcasts((current) => [result, ...current]);
      setForm({ title: '', description: '', category_id: '', quantity: '', unit: '', budget: '', deadline: '' });
      toast({ title: 'Requirement broadcasted', description: 'Verified sellers can now reply to your request.' });
    } catch (error) {
      toast({ title: 'Could not post requirement', description: error instanceof Error ? error.message : 'Please try again', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const sendResponse = async (broadcastId: number) => {
    if (!responseDraft.message.trim()) return;
    setIsResponding(broadcastId);
    try {
      const response = await fetch(`/api/broadcasts/${broadcastId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: responseDraft.message,
          price_offer: responseDraft.price_offer || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send response');
      setBroadcasts((current) => current.map((item) =>
        item.id === broadcastId ? { ...item, response_count: item.response_count + 1 } : item,
      ));
      setResponseDraft({ message: '', price_offer: '' });
      setIsResponding(null);
      toast({ title: 'Reply sent to buyer' });
    } catch (error) {
      toast({ title: 'Could not send reply', description: error instanceof Error ? error.message : 'Please try again', variant: 'destructive' });
      setIsResponding(null);
    }
  };

  const showReplies = async (broadcastId: number) => {
    if (expanded === broadcastId) {
      setExpanded(null);
      return;
    }
    try {
      const response = await fetch(`/api/broadcasts/${broadcastId}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load replies');
      setBroadcasts((current) => current.map((item) => item.id === broadcastId ? result : item));
      setExpanded(broadcastId);
    } catch (error) {
      toast({ title: 'Could not load replies', description: error instanceof Error ? error.message : 'Please try again', variant: 'destructive' });
    }
  };

  if (isLoadingUser || !user) {
    return (
      <DashboardLayout role={role}>
        <Skeleton className="h-96 rounded-xl" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {role === 'buyer' ? 'Broadcast a Requirement' : 'Buyer Requirements'}
            </h1>
            <p className="text-muted-foreground">
              {role === 'buyer'
                ? 'Tell verified suppliers what you need and receive competitive replies.'
                : 'Find open buyer requirements and respond with your offer.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadBroadcasts()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {role === 'buyer' && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Post your requirement</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createBroadcast} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input required placeholder="What are you looking for?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Select a category</option>
                  {(categories ?? []).filter((category) => !(category as any).parent_id).map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <Textarea required placeholder="Describe your requirement, specifications, and delivery location..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="md:col-span-2" />
                <Input placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                <Input placeholder="Unit (pieces, kg, metres...)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                <Input type="number" min="0" placeholder="Budget (₹)" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                <Input type="date" min={new Date().toISOString().split('T')[0]} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                <Button type="submit" disabled={isCreating} className="md:col-span-2 sm:w-fit">
                  <Send className="h-4 w-4 mr-2" /> {isCreating ? 'Broadcasting…' : 'Broadcast to Verified Sellers'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Open requirements</h2>
          {isLoading ? (
            [...Array(3)].map((_, index) => <Skeleton key={index} className="h-40 rounded-xl" />)
          ) : broadcasts.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-muted-foreground">No open requirements right now.</CardContent></Card>
          ) : (
            broadcasts.map((broadcast) => (
              <Card key={broadcast.id} className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center mb-2">
                        <h3 className="text-lg font-bold">{broadcast.title}</h3>
                        {broadcast.buyer_id === user.id && <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">Your requirement</Badge>}
                        {broadcast.category_name && <Badge variant="secondary">{broadcast.category_name}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{broadcast.description}</p>
                      <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                        {broadcast.quantity && <span>Qty: <strong className="text-foreground">{broadcast.quantity} {broadcast.unit}</strong></span>}
                        {broadcast.budget !== null && <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" /> Budget: <strong className="text-foreground">{broadcast.budget.toLocaleString('en-IN')}</strong></span>}
                        <span>By {broadcast.buyer_name}</span>
                        <span>{new Date(broadcast.created_at).toLocaleDateString()}</span>
                        <button type="button" className="flex items-center gap-1 text-primary hover:underline" onClick={() => void showReplies(broadcast.id)}>
                          <MessageSquare className="h-3.5 w-3.5" /> {broadcast.response_count} replies
                        </button>
                      </div>

                      {expanded === broadcast.id && broadcast.responses && (
                        <div className="mt-4 border-t border-border/50 pt-4 space-y-3">
                          {broadcast.responses.length === 0 ? <p className="text-sm text-muted-foreground">No replies yet.</p> : broadcast.responses.map((response) => (
                            <div key={response.id} className="rounded-lg bg-muted/50 p-3">
                              <div className="flex justify-between gap-2 text-sm font-semibold">
                                <span>{response.seller_business_name}</span>
                                {response.price_offer !== null && <span>₹{response.price_offer.toLocaleString('en-IN')}</span>}
                              </div>
                              <p className="text-sm mt-1">{response.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {role === 'seller' && (
                      <div className="lg:w-72 shrink-0">
                        {isResponding === broadcast.id ? (
                          <div className="space-y-2 rounded-lg border border-primary/20 p-3">
                            <Textarea autoFocus placeholder="Your offer and message to the buyer..." value={responseDraft.message} onChange={(e) => setResponseDraft({ ...responseDraft, message: e.target.value })} />
                            <Input type="number" min="0" placeholder="Price offer (optional)" value={responseDraft.price_offer} onChange={(e) => setResponseDraft({ ...responseDraft, price_offer: e.target.value })} />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => void sendResponse(broadcast.id)} disabled={!responseDraft.message.trim()}>Send reply</Button>
                              <Button size="sm" variant="ghost" onClick={() => { setIsResponding(null); setResponseDraft({ message: '', price_offer: '' }); }}><X className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ) : (
                          <Button className="w-full" onClick={() => setIsResponding(broadcast.id)}>
                            <MessageSquare className="h-4 w-4 mr-2" /> Reply to buyer
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}