import { useRequireAuth } from '@/hooks/use-auth';
import { Navbar } from './Navbar';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  MessageSquare, 
  Users,
  Building2,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardLayout({ 
  children,
  role
}: { 
  children: React.ReactNode;
  role: 'buyer' | 'seller' | 'admin';
}) {
  const { user, isLoading } = useRequireAuth([role]);
  const [location] = useLocation();

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const navItems = {
    buyer: [
      { href: '/dashboard/buyer', label: 'Dashboard', icon: LayoutDashboard },
    ],
    seller: [
      { href: '/dashboard/seller', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/seller/products', label: 'My Products', icon: Package },
      { href: '/dashboard/seller/services', label: 'My Services', icon: Wrench },
    ],
    admin: [
      { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/admin/sellers', label: 'Seller Approvals', icon: Building2 },
    ]
  };

  const items = navItems[role];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/30">
      <Navbar />
      <div className="flex-1 flex container mx-auto px-4 py-8 gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <div className="sticky top-24 bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="mb-6 px-4">
              <h2 className="font-display font-bold text-lg">
                {role === 'buyer' ? 'Buyer Panel' : role === 'seller' ? 'Seller Hub' : 'Admin Control'}
              </h2>
              <p className="text-sm text-muted-foreground">{user.name}</p>
            </div>
            <nav className="flex flex-col gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href || (location.startsWith(item.href) && item.href !== `/dashboard/${role}`);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}