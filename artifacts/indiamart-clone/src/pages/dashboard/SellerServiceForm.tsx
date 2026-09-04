import { useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  useListCategories, 
  useGetService, 
  useCreateService, 
  useUpdateService,
  getGetServiceQueryKey,
  getListServicesQueryKey,
  getGetSellerDashboardQueryKey
} from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2 } from 'lucide-react';

const serviceSchema = z.object({
  category_id: z.coerce.number().min(1, 'Please select a category'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price_min: z.coerce.number().optional().nullable(),
  price_max: z.coerce.number().optional().nullable(),
  price_unit: z.enum(['per_hour', 'per_day', 'per_project', 'fixed', 'negotiable']),
  tags_string: z.string().optional(),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  is_featured: z.boolean().default(false),
});

export default function SellerServiceForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id && id !== 'new';
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading: categoriesLoading } = useListCategories();
  const { data: service, isLoading: serviceLoading } = useGetService(Number(id), {
    query: { queryKey: getGetServiceQueryKey(Number(id)), enabled: isEditing }
  });

  const createMutation = useCreateService();
  const updateMutation = useUpdateService();

  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      category_id: 0,
      title: '',
      description: '',
      price_min: undefined,
      price_max: undefined,
      price_unit: 'fixed',
      tags_string: '',
      image_url: '',
      is_featured: false,
    },
  });

  useEffect(() => {
    if (isEditing && service) {
      form.reset({
        category_id: service.category_id,
        title: service.title,
        description: service.description,
        price_min: service.price_min,
        price_max: service.price_max,
        price_unit: service.price_unit as any,
        tags_string: service.tags ? service.tags.join(', ') : '',
        image_url: service.images && service.images.length > 0 ? service.images[0] : '',
        is_featured: service.is_featured,
      });
    }
  }, [isEditing, service, form]);

  const onSubmit = (data: z.infer<typeof serviceSchema>) => {
    const tags = data.tags_string 
      ? data.tags_string.split(',').map(t => t.trim()).filter(Boolean) 
      : [];
      
    const images = data.image_url ? [data.image_url] : [];

    const payload = {
      category_id: data.category_id,
      title: data.title,
      description: data.description,
      price_min: data.price_min || null,
      price_max: data.price_max || null,
      price_unit: data.price_unit as any,
      tags,
      images,
      is_featured: data.is_featured,
    };

    if (isEditing) {
      updateMutation.mutate({ id: Number(id), data: payload }, {
        onSuccess: () => {
          toast({ title: 'Service updated successfully' });
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSellerDashboardQueryKey() });
          setLocation('/dashboard/seller');
        },
        onError: (err: any) => {
          toast({ title: 'Failed to update', description: err.error, variant: 'destructive' });
        }
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: 'Service created successfully' });
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSellerDashboardQueryKey() });
          setLocation('/dashboard/seller');
        },
        onError: (err: any) => {
          toast({ title: 'Failed to create', description: err.error, variant: 'destructive' });
        }
      });
    }
  };

  if ((isEditing && serviceLoading) || categoriesLoading) {
    return (
      <DashboardLayout role="seller">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout role="seller">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard/seller"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">{isEditing ? 'Edit Service' : 'Add New Service'}</h1>
            <p className="text-muted-foreground">List a professional service for buyers.</p>
          </div>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold border-b border-border/50 pb-2">Basic Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Title *</FormLabel>
                        <FormControl><Input placeholder="e.g. Commercial Interior Design" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? field.value.toString() : ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what is included, process, timeline..." 
                            className="min-h-[150px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold border-b border-border/50 pb-2">Pricing & Terms</h3>
                  
                  <FormField
                    control={form.control}
                    name="price_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pricing Model *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pricing model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Price</SelectItem>
                            <SelectItem value="per_hour">Per Hour</SelectItem>
                            <SelectItem value="per_day">Per Day</SelectItem>
                            <SelectItem value="per_project">Per Project</SelectItem>
                            <SelectItem value="negotiable">Negotiable / On Request</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Price (₹)</FormLabel>
                          <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value || ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price_max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Price (₹)</FormLabel>
                          <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value || ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Media & Tags */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold border-b border-border/50 pb-2">Media & Discoverability</h3>
                  
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (Portfolio/Cover)</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('image_url') && (
                    <div className="w-48 h-32 rounded-lg border border-border/50 overflow-hidden bg-muted flex items-center justify-center">
                      <img src={form.watch('image_url')} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="tags_string"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search Tags</FormLabel>
                        <FormControl><Input placeholder="e.g. consulting, design, commercial (comma separated)" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 bg-muted/20">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Feature this service</FormLabel>
                          <div className="text-sm text-muted-foreground">Make it stand out on your profile and search results.</div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-6 border-t border-border/50 flex justify-end gap-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard/seller">Cancel</Link>
                  </Button>
                  <Button type="submit" size="lg" className="min-w-[150px] font-bold" disabled={isPending}>
                    {isPending ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Service')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}