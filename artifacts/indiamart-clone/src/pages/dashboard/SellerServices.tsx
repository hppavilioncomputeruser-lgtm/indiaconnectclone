import { useState } from 'react';
import { Link } from 'wouter';
import {
  useGetMe,
  useListServices,
  useDeleteService,
  getListServicesQueryKey,
  getGetSellerDashboardQueryKey,
} from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Wrench, Pencil, Trash2, Eye, IndianRupee } from 'lucide-react';

const PRICE_UNIT_LABELS: Record<string, string> = {
  per_hour: 'per hour',
  per_day: 'per day',
  per_project: 'per project',
  per_unit: 'per unit',
  monthly: 'monthly',
};

export default function SellerServices() {
  const { data: user } = useGetMe();
  const { data: servicesData, isLoading } = useListServices(
    user ? { seller_id: user.id as unknown as string, limit: '100' } : undefined,
    { query: { enabled: !!user } }
  );
  const deleteService = useDeleteService();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = () => {
    if (deletingId === null) return;
    deleteService.mutate(
      { id: deletingId },
      {
        onSuccess: () => {
          toast({ title: 'Service deleted successfully' });
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSellerDashboardQueryKey() });
          setDeletingId(null);
        },
        onError: (err: any) => {
          toast({ title: 'Failed to delete service', description: err?.error ?? 'Unknown error', variant: 'destructive' });
          setDeletingId(null);
        },
      }
    );
  };

  const services = servicesData?.items ?? [];

  return (
    <DashboardLayout role="seller">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">My Services</h1>
            <p className="text-muted-foreground">Manage your service listings.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/seller/services/new">
              <Plus className="h-4 w-4 mr-2" /> Add Service
            </Link>
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
            <Wrench className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No services yet</h3>
            <p className="text-muted-foreground mb-6">Add your first service so buyers can find and contact you.</p>
            <Button asChild>
              <Link href="/dashboard/seller/services/new">
                <Plus className="h-4 w-4 mr-2" /> Add First Service
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <Card key={service.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Thumbnail */}
                    <div className="w-full sm:w-24 h-24 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {service.images && service.images.length > 0 ? (
                        <img
                          src={service.images[0]}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Wrench className="h-10 w-10 text-muted-foreground/30" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-lg leading-tight line-clamp-1">{service.title}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={
                              service.status === 'active'
                                ? 'bg-success/10 text-success border-success/20'
                                : 'bg-muted text-muted-foreground'
                            }
                          >
                            {service.status}
                          </Badge>
                          {service.is_featured && (
                            <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{service.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {service.price_min?.toLocaleString('en-IN')}
                          {service.price_max ? ` – ${service.price_max.toLocaleString('en-IN')}` : ''}
                          <span className="text-muted-foreground font-normal ml-0.5">
                            {PRICE_UNIT_LABELS[service.price_unit ?? ''] ?? service.price_unit}
                          </span>
                        </span>
                        <span className="text-muted-foreground">{service.category_name}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/services/${service.id}`}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/seller/services/${service.id}/edit`}>
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
                        onClick={() => setDeletingId(service.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the service listing. Existing inquiries linked to it will remain but the listing won't be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleDelete}
              disabled={deleteService.isPending}
            >
              {deleteService.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
