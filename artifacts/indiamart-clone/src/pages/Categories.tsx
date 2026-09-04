import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useListCategories } from '@workspace/api-client-react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Search, ChevronRight, Layers3 } from 'lucide-react';

type CategoryWithParent = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  parent_id?: number | null;
  product_count?: number;
  service_count?: number;
};

export default function Categories() {
  const { data, isLoading } = useListCategories();
  const [query, setQuery] = useState('');
  const categories = (data ?? []) as CategoryWithParent[];

  const { parents, childrenByParent } = useMemo(() => {
    const filtered = categories.filter((category) =>
      category.name.toLowerCase().includes(query.toLowerCase().trim()),
    );
    const parents = filtered.filter((category) => !category.parent_id);
    const childrenByParent = new Map<number, CategoryWithParent[]>();
    categories
      .filter((category) => category.parent_id && (!query.trim() || category.name.toLowerCase().includes(query.toLowerCase().trim())))
      .forEach((category) => {
        const children = childrenByParent.get(category.parent_id!) ?? [];
        children.push(category);
        childrenByParent.set(category.parent_id!, children);
      });
    return { parents, childrenByParent };
  }, [categories, query]);

  return (
    <BaseLayout>
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mb-10">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Explore the marketplace</p>
          <h1 className="text-4xl font-display font-bold mb-3">All Categories</h1>
          <p className="text-muted-foreground text-lg">
            Browse products and services across IndiaConnect's growing network of industries and specialist subcategories.
          </p>
          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search categories or subcategories"
              className="pl-10 h-12"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, index) => <Skeleton key={index} className="h-56 rounded-xl" />)}
          </div>
        ) : parents.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No categories match your search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parents.map((parent) => {
              const children = childrenByParent.get(parent.id) ?? [];
              return (
                <Card key={parent.id} className="border-border/50 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6">
                    <Link href={`/products?category_id=${parent.id}`} className="flex items-start gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-lg group-hover:text-primary transition-colors">{parent.name}</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(parent.product_count ?? 0) + (parent.service_count ?? 0)} marketplace listings
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-primary shrink-0" />
                    </Link>

                    {children.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-border/50">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Layers3 className="h-3.5 w-3.5" /> Subcategories
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/products?category_id=${child.id}`}
                              className="text-sm px-3 py-1.5 rounded-full bg-muted/70 hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </BaseLayout>
  );
}