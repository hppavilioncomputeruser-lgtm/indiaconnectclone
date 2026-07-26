import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegisterBuyer, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useRequireGuest } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const buyerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  auth_method: z.enum(['email', 'phone']),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9]{10}$/, 'Must be a 10-digit number').optional().or(z.literal('')),
}).refine(data => {
  if (data.auth_method === 'email') return !!data.email && !!data.password;
  if (data.auth_method === 'phone') return !!data.phone;
  return true;
}, {
  message: "Required fields missing based on selected method",
  path: ["auth_method"]
});

export default function RegisterBuyer() {
  const { isLoading: guestLoading } = useRequireGuest();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const registerMutation = useRegisterBuyer();

  const form = useForm<z.infer<typeof buyerSchema>>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      name: '',
      auth_method: 'email',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onSubmit = (data: z.infer<typeof buyerSchema>) => {
    // Clean up empty optional fields
    const payload = {
      ...data,
      email: data.email || null,
      password: data.password || null,
      phone: data.phone || null,
    };

    registerMutation.mutate({ data: payload }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({
          title: 'Account created!',
          description: 'Welcome to IndiaConnect',
        });
        setLocation('/dashboard/buyer');
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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Create Buyer Account</h1>
          <p className="text-muted-foreground">Start sourcing products from verified suppliers</p>
        </div>

        <Card className="border-border/60 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle>Sign up to source</CardTitle>
            <CardDescription>Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link></CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auth_method"
                  render={({ field }) => (
                    <FormItem className="pt-2">
                      <FormLabel>Sign up using</FormLabel>
                      <FormControl>
                        <Tabs 
                          value={field.value} 
                          onValueChange={(v) => {
                            field.onChange(v);
                            setAuthMethod(v as 'email'|'phone');
                          }} 
                          className="w-full"
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="email">Email</TabsTrigger>
                            <TabsTrigger value="phone">Phone</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {authMethod === 'email' ? (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="you@company.com" {...field} />
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
                          <FormControl>
                            <Input type="password" placeholder="Min. 8 characters" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-muted-foreground font-medium">+91</span>
                            <Input placeholder="10-digit mobile number" className="pl-12" {...field} maxLength={10} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full font-bold mt-6" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
                </Button>
                
                <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
                  Are you a supplier? <Link href="/register/seller" className="text-primary font-medium hover:underline">Register as Seller</Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}