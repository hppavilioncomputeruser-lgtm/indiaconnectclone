import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateInquiry } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, MessageSquare } from 'lucide-react';
import { Link } from 'wouter';

const inquirySchema = z.object({
  buyer_name: z.string().min(2, 'Name is required'),
  buyer_contact: z.string().min(5, 'Contact info is required'),
  message: z.string().min(10, 'Please provide more details (min 10 chars)'),
  quantity: z.coerce.number().optional().nullable(),
  budget: z.coerce.number().optional().nullable(),
});

type InquiryFormProps = {
  sellerId: number;
  sellerName: string;
  listingId: number;
  listingTitle: string;
  listingType: 'product' | 'service';
  onSuccess?: () => void;
};

export function InquiryForm({ sellerId, sellerName, listingId, listingTitle, listingType, onSuccess }: InquiryFormProps) {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } });
  const { toast } = useToast();
  const createInquiry = useCreateInquiry();

  const form = useForm<z.infer<typeof inquirySchema>>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      buyer_name: user?.name || '',
      buyer_contact: user?.email || user?.phone || '',
      message: `Hi ${sellerName}, I am interested in your ${listingType} "${listingTitle}". Please share more details.`,
      quantity: undefined,
      budget: undefined,
    },
  });

  const onSubmit = (data: z.infer<typeof inquirySchema>) => {
    if (user?.role === 'seller') {
      toast({
        title: "Action restricted",
        description: "Sellers cannot send inquiries. Please login as a buyer.",
        variant: "destructive"
      });
      return;
    }

    createInquiry.mutate({
      data: {
        ...data,
        seller_id: sellerId,
        product_id: listingType === 'product' ? listingId : undefined,
        service_id: listingType === 'service' ? listingId : undefined,
        listing_title: listingTitle,
        listing_type: listingType,
      }
    }, {
      onSuccess: () => {
        toast({
          title: 'Inquiry Sent Successfully',
          description: `The seller will respond to your contact details shortly.`,
        });
        if (onSuccess) onSuccess();
        form.reset();
      },
      onError: (err: any) => {
        toast({
          title: 'Failed to send inquiry',
          description: err.error || 'Please try again later',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card className="border-primary/20 shadow-lg shadow-primary/5 sticky top-24">
      <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Send Inquiry to Supplier
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your requirements in detail..." 
                      className="resize-none min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Optional" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Budget (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Optional" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Your Contact Details</p>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="buyer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buyer_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Email or Phone Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full font-bold text-base h-12 mt-2 shadow-md hover-elevate"
              disabled={createInquiry.isPending || user?.role === 'seller'}
            >
              {createInquiry.isPending ? 'Sending...' : 'Send Inquiry Now'}
            </Button>
            
            {user?.role === 'seller' && (
              <p className="text-xs text-destructive text-center mt-2">
                Sellers cannot send inquiries. Please login as a buyer.
              </p>
            )}

            {!user && (
              <div className="text-center text-xs text-muted-foreground mt-4">
                <Link href="/login" className="text-primary hover:underline">Log in</Link> to track your inquiries
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-xs text-success font-medium mt-4 bg-success/10 py-2 rounded-md">
              <ShieldCheck className="h-3.5 w-3.5" /> Your contact info is secure
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}