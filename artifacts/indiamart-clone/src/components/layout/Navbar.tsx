import { Link, useLocation } from 'wouter';
import { useGetMe, useLogout, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Search, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } });
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation('/');
      }
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
              I
            </div>
            <span className="font-display font-bold text-xl hidden sm:inline-block">
              India<span className="text-primary">Connect</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
            <Link href="/services" className="hover:text-primary transition-colors">Services</Link>
            <Link href="/sellers" className="hover:text-primary transition-colors">Suppliers</Link>
          </nav>
        </div>

        <div className="flex-1 max-w-xl hidden lg:flex items-center">
          <form 
            className="relative w-full"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get('q');
              if (q) setLocation(`/products?q=${encodeURIComponent(q as string)}`);
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              name="q"
              type="search" 
              placeholder="Search products, services, or suppliers..." 
              className="w-full h-10 pl-10 pr-4 rounded-full border border-input bg-muted/30 focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </form>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
               <DropdownMenuContent className="w-72" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-4 text-muted-foreground break-all whitespace-normal">
                      {user.email || user.phone}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/${user.role}`} className="w-full cursor-pointer">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/register/buyer">Join Free</Link>
              </Button>
            </div>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-4">
          <form 
            className="relative w-full"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get('q');
              if (q) {
                setLocation(`/products?q=${encodeURIComponent(q as string)}`);
                setIsMobileMenuOpen(false);
              }
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              name="q"
              type="search" 
              placeholder="Search..." 
              className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background"
            />
          </form>
          <nav className="flex flex-col gap-2">
            <Link href="/products" className="p-2 hover:bg-muted rounded-md font-medium">Products</Link>
            <Link href="/services" className="p-2 hover:bg-muted rounded-md font-medium">Services</Link>
            <Link href="/sellers" className="p-2 hover:bg-muted rounded-md font-medium">Suppliers</Link>
            {!user && (
              <div className="pt-4 border-t border-border flex flex-col gap-2 mt-2">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register/buyer">Join Free</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}