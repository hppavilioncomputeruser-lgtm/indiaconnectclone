import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useListCategories, useListFeaturedProducts, useListFeaturedServices } from '@workspace/api-client-react';
import { Search, Building2, TrendingUp, ShieldCheck, ArrowRight, ChevronRight, Package, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();

  const { data: categories, isLoading: isLoadingCategories } = useListCategories();
  const { data: featuredProducts, isLoading: isLoadingProducts } = useListFeaturedProducts({ limit: 8 });
  const { data: featuredServices, isLoading: isLoadingServices } = useListFeaturedServices({ limit: 4 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-secondary text-secondary-foreground overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center max-w-4xl">
          <Badge variant="outline" className="border-primary/50 text-primary-foreground bg-primary/20 mb-6 py-1.5 px-4 backdrop-blur-md">
            India's Fastest Growing B2B Network
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6 leading-tight">
            Connect with Trusted <br className="hidden md:block"/> 
            <span className="text-primary">Suppliers & Manufacturers</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary-foreground/80 mb-10 max-w-2xl">
            Sourcing made simple. Discover millions of products and verified services from businesses across India.
          </p>

          <form onSubmit={handleSearch} className="w-full max-w-3xl flex flex-col sm:flex-row gap-3 p-2 bg-background/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="What are you looking for?" 
                className="w-full h-14 pl-12 text-lg bg-background text-foreground border-none rounded-xl focus-visible:ring-primary shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 rounded-xl text-lg font-bold shadow-lg hover-elevate shadow-primary/25">
              Search
            </Button>
          </form>

          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm font-medium text-secondary-foreground/70">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Verified Sellers</span>
            <span className="hidden sm:inline-block text-secondary-foreground/30">•</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" /> Direct Wholesale Prices</span>
            <span className="hidden sm:inline-block text-secondary-foreground/30">•</span>
            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-primary" /> 10,000+ Categories</span>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold mb-3">Explore Categories</h2>
              <p className="text-muted-foreground">Find products and services across top industries</p>
            </div>
            <Button variant="ghost" className="hidden sm:flex" asChild>
                <Link href="/categories">View All Categories <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          {isLoadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {categories?.slice(0, 12).map((category) => (
                <Link key={category.id} href={`/products?category_id=${category.id}`}>
                  <Card className="h-full hover-elevate transition-all border-border/50 hover:border-primary/50 cursor-pointer group bg-card">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        {/* Fallback to generic icon since we don't have dynamic imports here easily, 
                            though in a real app we'd map category.icon to a component */}
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{category.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{category.product_count} Products</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold mb-3">Trending Products</h2>
              <p className="text-muted-foreground">High-demand wholesale products from verified suppliers</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/products">View More <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>

          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
            </div>
          ) : (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-4">
                {(featuredProducts ?? []).map((product) => (
                  <CarouselItem key={product.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <Link href={`/products/${product.id}`}>
                      <Card className="h-full hover-elevate overflow-hidden border-border/50 cursor-pointer group">
                        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-secondary/5">
                              <Package className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex gap-2">
                            {product.is_featured && (
                              <Badge className="bg-primary hover:bg-primary text-primary-foreground shadow-sm">Featured</Badge>
                            )}
                          </div>
                        </div>
                        <CardContent className="p-5">
                          <div className="text-xs font-medium text-primary mb-2">{product.category_name}</div>
                          <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
                          <div className="font-display font-bold text-xl mb-4">
                            ₹{product.price_min?.toLocaleString('en-IN')} 
                            {product.price_max ? ` - ₹${product.price_max.toLocaleString('en-IN')}` : ''}
                            <span className="text-sm text-muted-foreground font-normal ml-1">/ {product.unit}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border/50">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">{product.seller_name}</span>
                            <span className="mx-1">•</span>
                            <span className="truncate">{product.seller_city}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-end gap-2 mt-6">
                <CarouselPrevious className="relative inset-auto translate-y-0 h-10 w-10 bg-background" />
                <CarouselNext className="relative inset-auto translate-y-0 h-10 w-10 bg-background" />
              </div>
            </Carousel>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold mb-3">Professional B2B Services</h2>
              <p className="text-muted-foreground">Find manufacturing, logistics, and business services</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/services">Browse Services</Link>
            </Button>
          </div>

          {isLoadingServices ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(featuredServices ?? []).map((service) => (
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
                    <CardContent className="p-6 flex flex-col flex-1 justify-center">
                      <div className="text-xs font-medium text-primary mb-2">{service.category_name}</div>
                      <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">{service.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{service.description}</p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="font-display font-bold">
                          ₹{service.price_min?.toLocaleString('en-IN')}
                          <span className="text-xs text-muted-foreground font-normal ml-1">/ {service.price_unit.replace('_', ' ')}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {service.seller_city}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Grow Your Business on IndiaConnect</h2>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-xl">
              Join thousands of suppliers who have scaled their wholesale business. Get verified, list your products, and start receiving inquiries from buyers pan-India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-bold shadow-xl" asChild>
                <Link href="/register/seller">Register as Seller</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-white/30 hover:bg-white/10 text-white" asChild>
                <Link href="/how-it-works">Learn More</Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 text-center transform translate-y-4">
              <div className="text-4xl font-display font-bold mb-2">5M+</div>
              <div className="text-sm font-medium text-primary-foreground/80">Active Buyers</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 text-center">
              <div className="text-4xl font-display font-bold mb-2">10k+</div>
              <div className="text-sm font-medium text-primary-foreground/80">Verified Sellers</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 text-center">
              <div className="text-4xl font-display font-bold mb-2">50k+</div>
              <div className="text-sm font-medium text-primary-foreground/80">Daily Inquiries</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 text-center transform -translate-y-4">
              <div className="text-4xl font-display font-bold mb-2">All</div>
              <div className="text-sm font-medium text-primary-foreground/80">Indian States</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}