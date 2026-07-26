import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useListSellers } from '@workspace/api-client-react';
import { Search, Building2, MapPin, Package, Wrench, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function Sellers() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') || '');
    setCity(params.get('city') || '');
    setPage(1);
  }, [location]);

  const { data: sellersData, isLoading } = useListSellers({
    q: query || undefined,
    city: city || undefined,
    page,
    limit: 12
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city) params.set('city', city);
    window.history.replaceState({}, '', `/sellers?${params.toString()}`);
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-foreground">Verified Suppliers Directory</h1>
        <p className="text-xl text-muted-foreground mb-8">Connect with top manufacturers, wholesalers, and service providers across India.</p>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 bg-card p-2 rounded-2xl shadow-lg border border-border/50">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by company name or products..." 
              className="pl-12 h-14 text-lg border-none bg-transparent focus-visible:ring-0 shadow-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="w-px bg-border my-2 hidden sm:block"></div>
          <div className="relative sm:w-64">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Any City" 
              className="pl-12 h-14 text-lg border-none bg-transparent focus-visible:ring-0 shadow-none"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="h-14 px-8 text-lg font-bold rounded-xl">Search</Button>
        </form>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-medium">
          {query || city ? 'Search Results' : 'Featured Suppliers'}
          <span className="text-muted-foreground ml-2">({sellersData?.total || 0})</span>
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : sellersData?.items.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No suppliers found</h3>
          <p className="text-muted-foreground mb-6">Try adjusting your search terms or location.</p>
          <Button onClick={() => { setQuery(''); setCity(''); }}>Clear Search</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellersData?.items.map((seller) => (
            <Link key={seller.id} href={`/sellers/${seller.id}`}>
              <Card className="h-full hover-elevate overflow-hidden border-border/50 cursor-pointer group transition-colors hover:border-primary/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-2xl font-display font-bold text-primary">{seller.business_name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight mb-1 truncate group-hover:text-primary transition-colors" title={seller.business_name}>
                        {seller.business_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-success font-medium mb-1">
                        <ShieldCheck className="h-4 w-4" /> Trust Verified
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{seller.city}, {seller.state}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-6 p-3 bg-muted/30 rounded-lg">
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                      <div className="text-xl font-display font-bold text-foreground">{seller.product_count}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" /> Products</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 text-center border-l border-border/50">
                      <div className="text-xl font-display font-bold text-foreground">{seller.service_count}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Wrench className="h-3 w-3" /> Services</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {sellersData && sellersData.total_pages > 1 && (
        <div className="flex justify-center mt-12 gap-2">
          <Button 
            variant="outline" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center px-4 font-medium">
            Page {page} of {sellersData.total_pages}
          </div>
          <Button 
            variant="outline" 
            disabled={page === sellersData.total_pages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}