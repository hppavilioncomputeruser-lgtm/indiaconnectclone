import { useParams, Link } from 'wouter';
import { useGetSeller } from '@workspace/api-client-react';
import { Building2, MapPin, ShieldCheck, Package, Wrench, Mail, Phone, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SellerDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: seller, isLoading } = useGetSeller(Number(id), {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-48 w-full rounded-2xl mb-8" />
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[300px] rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Seller Not Found</h2>
        <p className="text-muted-foreground mb-6">This seller profile does not exist or has been removed.</p>
        <Link href="/sellers" className="text-primary hover:underline font-medium">Browse directory</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/sellers" className="hover:text-primary transition-colors">Suppliers</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{seller.business_name}</span>
      </div>

      {/* Seller Header */}
      <Card className="border-border/50 mb-8 overflow-hidden bg-card">
        <div className="h-32 bg-primary/10"></div>
        <CardContent className="px-6 pb-8 md:px-10 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 mb-6">
            <div className="w-32 h-32 rounded-2xl bg-background border-4 border-background shadow-lg flex items-center justify-center shrink-0">
              <span className="text-6xl font-display font-bold text-primary">{seller.business_name.charAt(0)}</span>
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-display font-bold leading-tight">{seller.business_name}</h1>
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1.5 py-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Trust Verified
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {seller.city}, {seller.state}</span>
                <span className="flex items-center gap-1.5"><Badge variant="secondary">GST: {seller.gst_number}</Badge></span>
                <span>Member since {new Date(seller.created_at).getFullYear()}</span>
              </div>
            </div>
          </div>

          {seller.business_description && (
            <div className="prose prose-slate max-w-4xl text-muted-foreground border-t border-border/50 pt-6">
              <p className="whitespace-pre-wrap">{seller.business_description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offerings Tabs */}
      <Tabs defaultValue={seller.products?.length > 0 ? "products" : "services"} className="w-full">
        <TabsList className="mb-6 bg-transparent border-b border-border/50 w-full justify-start rounded-none h-12 p-0">
          {seller.products?.length > 0 && (
            <TabsTrigger 
              value="products" 
              className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-6 h-full text-base font-medium"
            >
              <Package className="h-4 w-4 mr-2" />
              Products ({seller.products.length})
            </TabsTrigger>
          )}
          {seller.services?.length > 0 && (
            <TabsTrigger 
              value="services" 
              className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-6 h-full text-base font-medium"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Services ({seller.services.length})
            </TabsTrigger>
          )}
        </TabsList>

        {seller.products?.length > 0 && (
          <TabsContent value="products" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {seller.products.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="h-full flex flex-col hover-elevate overflow-hidden border-border/50 cursor-pointer group bg-card">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/5">
                          <Package className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="text-xs font-medium text-primary mb-1 truncate">{product.category_name}</div>
                      <h3 className="font-bold text-base leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
                      <div className="font-display font-bold text-lg mt-auto">
                        ₹{product.price_min?.toLocaleString('en-IN')} 
                        {product.price_max ? ` - ₹${product.price_max.toLocaleString('en-IN')}` : ''}
                        <span className="text-xs text-muted-foreground font-normal ml-1">/ {product.unit}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        )}

        {seller.services?.length > 0 && (
          <TabsContent value="services" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {seller.services.map((service) => (
                <Link key={service.id} href={`/services/${service.id}`}>
                  <Card className="flex flex-col sm:flex-row h-full hover-elevate overflow-hidden border-border/50 cursor-pointer group">
                    <div className="w-full sm:w-48 aspect-video sm:aspect-auto bg-muted shrink-0 relative overflow-hidden">
                      {service.images && service.images.length > 0 ? (
                        <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/5">
                          <Wrench className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5 flex flex-col flex-1 justify-center">
                      <div className="text-xs font-medium text-primary mb-1">{service.category_name}</div>
                      <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">{service.title}</h3>
                      
                      <div className="font-display font-bold mt-auto">
                        ₹{service.price_min?.toLocaleString('en-IN')}
                        <span className="text-xs text-muted-foreground font-normal ml-1">/ {service.price_unit.replace('_', ' ')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}