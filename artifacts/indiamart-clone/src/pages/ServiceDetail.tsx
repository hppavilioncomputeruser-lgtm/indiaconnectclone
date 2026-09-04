import { useParams, Link } from 'wouter';
import { useGetService, getGetServiceQueryKey } from '@workspace/api-client-react';
import { Wrench, Building2, MapPin, CheckCircle2, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { InquiryForm } from '@/components/shared/InquiryForm';
import { Button } from '@/components/ui/button';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: service, isLoading } = useGetService(Number(id), {
    query: { queryKey: getGetServiceQueryKey(Number(id)), enabled: !!id }
  });
  const sellerProfileId = (service as (typeof service & { seller_profile_id?: number | null }) | undefined)?.seller_profile_id ?? service?.seller_id;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <Skeleton className="aspect-video rounded-xl w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="w-full lg:w-[400px]">
            <Skeleton className="h-[500px] rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Service Not Found</h2>
        <p className="text-muted-foreground mb-6">The service you are looking for does not exist or has been removed.</p>
        <Link href="/services" className="text-primary hover:underline font-medium">Browse other services</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/services" className="hover:text-primary transition-colors">Services</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/services?category_id=${service.category_id}`} className="hover:text-primary transition-colors">{service.category_name}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{service.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden mb-8">
            {/* Image Gallery */}
            <div className="aspect-video bg-muted relative flex items-center justify-center border-b border-border/50">
              {service.images && service.images.length > 0 ? (
                <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <Wrench className="h-24 w-24 text-muted-foreground/20" />
              )}
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  {service.category_name}
                </Badge>
                {service.is_featured && <Badge className="bg-primary">Featured Service</Badge>}
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-4 leading-tight">
                {service.title}
              </h1>

              <div className="font-display font-bold text-3xl md:text-4xl text-foreground mb-8">
                ₹{service.price_min?.toLocaleString('en-IN')} 
                {service.price_max ? ` - ₹${service.price_max.toLocaleString('en-IN')}` : ''}
                <span className="text-lg text-muted-foreground font-normal ml-2">/ {service.price_unit.replace('_', ' ')}</span>
              </div>

              <div className="prose prose-slate max-w-none mb-8">
                <h3 className="font-display font-bold text-xl mb-4">Service Details</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {service.description}
                </p>
              </div>

              {service.tags && service.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="bg-muted/50">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seller Details Card for mobile */}
          <Card className="border-border/50 mb-8 lg:hidden">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-xl mb-4">Service Provider</h3>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <Link href={`/sellers/${sellerProfileId}`} className="font-bold text-lg hover:text-primary hover:underline flex items-center gap-2">
                    {service.seller_name}
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </Link>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-1 text-sm">
                    <MapPin className="h-4 w-4" />
                    {service.seller_city}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-[400px] shrink-0 space-y-6">
          {/* Seller Card (Desktop) */}
          <Card className="border-border/50 hidden lg:block">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">Service Provider</p>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <Link href={`/sellers/${sellerProfileId}`} className="font-bold text-lg hover:text-primary hover:underline flex items-center gap-2 leading-tight">
                    {service.seller_name}
                  </Link>
                  <div className="flex items-center gap-1.5 text-success text-sm font-medium mt-1">
                    <CheckCircle2 className="h-4 w-4" /> Verified Business
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {service.seller_city}
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-6" asChild>
                <Link href={`/sellers/${sellerProfileId}`}>View Full Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Inquiry Form */}
          <InquiryForm 
            sellerId={service.seller_id}
            sellerName={service.seller_name}
            listingId={service.id}
            listingTitle={service.title}
            listingType="service"
          />
        </aside>
      </div>
    </div>
  );
}