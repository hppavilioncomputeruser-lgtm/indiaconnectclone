import { useParams, Link } from 'wouter';
import { useGetProduct, getGetProductQueryKey } from '@workspace/api-client-react';
import { Package, Building2, MapPin, CheckCircle2, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { InquiryForm } from '@/components/shared/InquiryForm';
import { Button } from '@/components/ui/button';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: product, isLoading } = useGetProduct(Number(id), {
    query: { queryKey: getGetProductQueryKey(Number(id)), enabled: !!id }
  });
  const sellerProfileId = (product as (typeof product & { seller_profile_id?: number | null }) | undefined)?.seller_profile_id ?? product?.seller_id;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <Skeleton className="aspect-[4/3] rounded-xl w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="w-full lg:w-[400px]">
            <Skeleton className="h-[500px] rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link href="/products" className="text-primary hover:underline font-medium">Browse other products</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/products?category_id=${product.category_id}`} className="hover:text-primary transition-colors">{product.category_name}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden mb-8">
            {/* Image Gallery (Simplified to single image for now) */}
            <div className="aspect-[16/9] bg-muted relative flex items-center justify-center border-b border-border/50">
              {product.images && product.images.length > 0 ? (
                <img src={product.images[0]} alt={product.title} className="w-full h-full object-contain bg-white" />
              ) : (
                <Package className="h-24 w-24 text-muted-foreground/20" />
              )}
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  {product.category_name}
                </Badge>
                {product.is_featured && <Badge className="bg-primary">Featured Product</Badge>}
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-4 leading-tight">
                {product.title}
              </h1>

              <div className="font-display font-bold text-3xl md:text-4xl text-foreground mb-8">
                ₹{product.price_min?.toLocaleString('en-IN')} 
                {product.price_max ? ` - ₹${product.price_max.toLocaleString('en-IN')}` : ''}
                <span className="text-lg text-muted-foreground font-normal ml-2">/ {product.unit}</span>
              </div>

              <div className="prose prose-slate max-w-none mb-8">
                <h3 className="font-display font-bold text-xl mb-4">Product Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="bg-muted/50">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seller Details Card for mobile (visible below product on small screens) */}
          <Card className="border-border/50 mb-8 lg:hidden">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-xl mb-4">Supplier Details</h3>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <Link href={`/sellers/${sellerProfileId}`} className="font-bold text-lg hover:text-primary hover:underline flex items-center gap-2">
                    {product.seller_name}
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </Link>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-1 text-sm">
                    <MapPin className="h-4 w-4" />
                    {product.seller_city}
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
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">Sold By</p>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <Link href={`/sellers/${sellerProfileId}`} className="font-bold text-lg hover:text-primary hover:underline flex items-center gap-2 leading-tight">
                    {product.seller_name}
                  </Link>
                  <div className="flex items-center gap-1.5 text-success text-sm font-medium mt-1">
                    <CheckCircle2 className="h-4 w-4" /> Verified Supplier
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {product.seller_city}
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
            sellerId={product.seller_id}
            sellerName={product.seller_name}
            listingId={product.id}
            listingTitle={product.title}
            listingType="product"
          />
        </aside>
      </div>
    </div>
  );
}