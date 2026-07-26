import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegisterSeller, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useRequireGuest } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sellerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Must be a 10-digit number'),
  business_name: z.string().min(2, 'Business name is required'),
  business_description: z.string().optional(),
  aadhaar_number: z.string().regex(/^[0-9]{12}$/, 'Must be exactly 12 digits'),
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format (e.g. 22AAAAA0000A1Z5)'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Must be a 6-digit number'),
});

export default function RegisterSeller() {
  const { isLoading: guestLoading } = useRequireGuest();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const registerMutation = useRegisterSeller();

  const form = useForm<z.infer<typeof sellerSchema>>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      business_name: '',
      business_description: '',
      aadhaar_number: '',
      gst_number: '',
      city: '',
      state: '',
      pincode: '',
    },
    mode: 'onChange',
  });

  const aadhaarValue = form.watch('aadhaar_number');
  const isAadhaarValid = /^[0-9]{12}$/.test(aadhaarValue || '');

  const gstValue = form.watch('gst_number');
  const isGstValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstValue || '');

  const onSubmit = (data: z.infer<typeof sellerSchema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({
          title: 'Seller Account Created!',
          description: 'Please wait for admin approval.',
        });
        setLocation('/dashboard/seller');
      },
      onError: (err: any) => {
        toast({
          title: 'Registration failed',
          description: err.error || 'Something went wrong',
          variant: 'destructive',
        });
      }
    });
  };

  if (guestLoading) return null;

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 bg-muted/30">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2 text-primary">Become a Verified Seller</h1>
          <p className="text-muted-foreground">List your products and reach millions of buyers</p>
        </div>

        <Card className="border-border/60 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle>Seller Registration</CardTitle>
            <CardDescription>Fill in your business details. Verification takes 24-48 hours.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Account Details */}
                <div>
                  <h3 className="text-lg font-bold mb-4 pb-2 border-b border-border/50">1. Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Full Name</FormLabel>
                          <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl><Input type="email" placeholder="owner@business.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-muted-foreground font-medium">+91</span>
                              <Input placeholder="10-digit mobile" className="pl-12" {...field} maxLength={10} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl><Input type="password" placeholder="Min. 8 characters" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <h3 className="text-lg font-bold mb-4 pb-2 border-b border-border/50">2. Business Details</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="business_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company / Business Name</FormLabel>
                          <FormControl><Input placeholder="Acme Industries Pvt Ltd" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="business_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Description (Optional)</FormLabel>
                          <FormControl><Textarea placeholder="What does your business do?" className="resize-none" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* KYC & Location */}
                <div>
                  <h3 className="text-lg font-bold mb-4 pb-2 border-b border-border/50">3. Verification & Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="aadhaar_number"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>Aadhaar Number</FormLabel>
                              {isAadhaarValid && <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1"><CheckCircle2 className="w-3 h-3" /> Format Valid</Badge>}
                            </div>
                            <FormControl><Input placeholder="12-digit Aadhaar number" {...field} maxLength={12} /></FormControl>
                            <FormDescription>Your data is securely encrypted.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gst_number"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>GSTIN</FormLabel>
                              {isGstValid && <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1"><CheckCircle2 className="w-3 h-3" /> Format Valid</Badge>}
                            </div>
                            <FormControl><Input placeholder="e.g. 22AAAAA0000A1Z5" className="uppercase" {...field} maxLength={15} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl><Input placeholder="e.g. Mumbai" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl><Input placeholder="e.g. Maharashtra" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pincode</FormLabel>
                              <FormControl><Input placeholder="6-digit" {...field} maxLength={6} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50">
                  <Button type="submit" size="lg" className="w-full font-bold text-lg h-14" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? 'Submitting Application...' : 'Submit Seller Registration'}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground mt-4">
                    Already a seller? <Link href="/login" className="text-primary font-medium hover:underline">Log in here</Link>
                  </div>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}