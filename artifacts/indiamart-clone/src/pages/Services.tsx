import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useListServices, useListCategories } from '@workspace/api-client-react';
import { Search, SlidersHorizontal, Wrench, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function Services() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState<number | undefined>(
    searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') || '');
    setCategoryId(params.get('category_id') ? Number(params.get('category_id')) : undefined);
    setPage(1);
  }, [location]);

  const { data: categories } = useListCategories();
  const { data: servicesData, isLoading } = useListServices({
    q: query || undefined,
    category_id: categoryId,
    page,
    limit: 10
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (categoryId) params.set('category_id', categoryId.toString());
    window.history.replaceState({}, '', `/services?${params.toString()}`);
    setPage(1);
  };

  const selectCategory = (id?: number) => {
    setCategoryId(id);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (id) params.set('category_id', id.toString());
    window.history.replaceState({}, '', `/services?${params.toString()}`);
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 font-display font-bold text-lg mb-4">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  Filters
                </div>
                
                <Separator className="my-4" />
                
                <div className="mb-2 font-semibold">Service Categories</div>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-1">
                    <Button 
                      variant={categoryId === undefined ? "secondary" : "ghost"} 
                      className="w-full justify-start font-normal h-8"
                      onClick={() => selectCategory(undefined)}
                    >
                      All Categories
                    </Button>
                    {categories?.map(cat => (
                      <Button 
                        key={cat.id}
                        variant={categoryId === cat.id ? "secondary" : "ghost"} 
                        className="w-full justify-start font-normal h-8"
                        onClick={() => selectCategory(cat.id)}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{cat.service_count}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSearch} className="flex gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search business services, consulting, logistics..." 
                className="pl-10 h-12 text-lg bg-background"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">Search</Button>
          </form>

          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-display font-bold">
              {query ? `Search results for "${query}"` : 'B2B Services'}
              <span className="text-muted-foreground font-normal text-lg ml-2">
                ({servicesData?.total || 0} found)
              </span>
            </h1>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : servicesData?.items.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
              <Wrench className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No services found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filters to find what you're looking for.</p>
              <Button onClick={() => { setQuery(''); setCategoryId(undefined); }}>Clear All Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {servicesData?.items.map((service) => (
                <Link key={service.id} href={`/services/${service.id}`}>
                  <Card className="flex flex-col sm:flex-row h-full hover-elevate overflow-hidden border-border/50 cursor-pointer group">
                    <div className="w-full sm:w-64 aspect-video sm:aspect-auto bg-muted shrink-0 relative overflow-hidden">
                      {service.images && service.images.length > 0 ? (
                        <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/5">
                          <Wrench className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {service.is_featured && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-primary hover:bg-primary text-primary-foreground shadow-sm">Featured</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6 flex flex-col flex-1 justify-center">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
                        <div>
                          <div className="text-xs font-medium text-primary mb-1">{service.category_name}</div>
                          <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">{service.title}</h3>
                        </div>
                        <div className="font-display font-bold text-xl text-right shrink-0">
                          ₹{service.price_min?.toLocaleString('en-IN')}
                          {service.price_max ? ` - ${service.price_max.toLocaleString('en-IN')}` : ''}
                          <div className="text-xs text-muted-foreground font-normal">/ {service.price_unit.replace('_', ' ')}</div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-6 max-w-3xl">{service.description}</p>
                      
                      <div className="pt-4 border-t border-border/50 mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{service.seller_name}</span>
                          <span className="text-muted-foreground font-normal">in {service.seller_city}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="hidden sm:flex group-hover:text-primary">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {servicesData && servicesData.total_pages > 1 && (
            <div className="flex justify-center mt-12 gap-2">
              <Button 
                variant="outline" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center px-4 font-medium">
                Page {page} of {servicesData.total_pages}
              </div>
              <Button 
                variant="outline" 
                disabled={page === servicesData.total_pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}