import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLogin, useRequestOtp, useVerifyOtp, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useRequireGuest } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Mail, Phone, LockKeyhole } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const phoneSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Must be a 10-digit number'),
});

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 characters'),
});

export default function Login() {
  const { isLoading: guestLoading } = useRequireGuest();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('email');
  const [phoneForOtp, setPhoneForOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const loginMutation = useLogin();
  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const onLoginSuccess = (user: any) => {
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast({
      title: 'Welcome back!',
      description: `Logged in as ${user.name}`,
    });
    setLocation(`/dashboard/${user.role}`);
  };

  const onEmailSubmit = (data: z.infer<typeof emailSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => onLoginSuccess(res.user),
      onError: (err: any) => {
        toast({
          title: 'Login failed',
          description: err.error || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    });
  };

  const onPhoneSubmit = (data: z.infer<typeof phoneSchema>) => {
    requestOtpMutation.mutate({ data }, {
      onSuccess: (res) => {
        setPhoneForOtp(data.phone);
        setDevOtp(res.dev_otp || null);
        toast({
          title: 'OTP Sent',
          description: `An OTP has been sent to ${data.phone}`,
        });
      },
      onError: (err: any) => {
        toast({
          title: 'Failed to send OTP',
          description: err.error || 'Please check your phone number',
          variant: 'destructive',
        });
      }
    });
  };

  const onOtpSubmit = (data: z.infer<typeof otpSchema>) => {
    verifyOtpMutation.mutate({ data: { phone: phoneForOtp, otp: data.otp } }, {
      onSuccess: (res) => onLoginSuccess(res.user),
      onError: (err: any) => {
        toast({
          title: 'Verification failed',
          description: err.error || 'Invalid OTP',
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
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto mb-4 flex items-center justify-center text-primary-foreground font-display font-bold text-2xl shadow-lg">
            I
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your IndiaConnect account</p>
        </div>

        <Card className="border-border/60 shadow-xl shadow-black/5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone & OTP</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="email" className="mt-0 space-y-4">
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Enter your email" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Password</FormLabel>
                            <span className="text-xs text-primary font-medium hover:underline cursor-pointer">Forgot password?</span>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="Enter your password" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full font-bold" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="phone" className="mt-0">
                {!phoneForOtp ? (
                  <Form {...phoneForm}>
                    <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                      <FormField
                        control={phoneForm.control}
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
                      <Button type="submit" className="w-full font-bold" disabled={requestOtpMutation.isPending}>
                        {requestOtpMutation.isPending ? 'Sending...' : 'Send OTP'}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                      {devOtp && (
                        <Alert className="bg-primary/10 border-primary/20 text-primary">
                          <InfoIcon className="h-4 w-4" />
                          <AlertDescription className="font-mono font-medium">
                            Development OTP: {devOtp}
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="text-sm text-center mb-4">
                        OTP sent to +91 {phoneForOtp}. <span className="text-primary cursor-pointer hover:underline" onClick={() => setPhoneForOtp('')}>Change</span>
                      </div>
                      <FormField
                        control={otpForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enter OTP</FormLabel>
                            <FormControl>
                              <Input placeholder="6-digit OTP" className="text-center font-mono text-lg tracking-widest" {...field} maxLength={6} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full font-bold" disabled={verifyOtpMutation.isPending}>
                        {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify & Sign In'}
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t border-border/50 pt-6">
              <div className="text-sm text-center text-muted-foreground">
                Don't have an account?
              </div>
              <div className="flex gap-4 w-full">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register/buyer">Join as Buyer</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register/seller">Join as Seller</Link>
                </Button>
              </div>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}