import { Link } from 'wouter';

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
              I
            </div>
            <span className="font-display font-bold text-xl">
              India<span className="text-primary">Connect</span>
            </span>
          </Link>
          <p className="text-secondary-foreground/70 text-sm">
            India's premier B2B marketplace connecting buyers with verified suppliers, manufacturers, and service providers.
          </p>
        </div>
        
        <div>
          <h4 className="font-display font-bold mb-4">For Buyers</h4>
          <ul className="flex flex-col gap-2 text-sm text-secondary-foreground/70">
            <li><Link href="/products" className="hover:text-primary transition-colors">Browse Products</Link></li>
            <li><Link href="/services" className="hover:text-primary transition-colors">Find Services</Link></li>
            <li><Link href="/sellers" className="hover:text-primary transition-colors">Verified Suppliers</Link></li>
            <li><Link href="/register/buyer" className="hover:text-primary transition-colors">Register as Buyer</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4">For Sellers</h4>
          <ul className="flex flex-col gap-2 text-sm text-secondary-foreground/70">
            <li><Link href="/register/seller" className="hover:text-primary transition-colors">Sell on IndiaConnect</Link></li>
            <li><Link href="/login" className="hover:text-primary transition-colors">Seller Login</Link></li>
            <li><span className="hover:text-primary transition-colors cursor-pointer">Verification Process</span></li>
            <li><span className="hover:text-primary transition-colors cursor-pointer">Success Stories</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4">Support</h4>
          <ul className="flex flex-col gap-2 text-sm text-secondary-foreground/70">
            <li><span className="hover:text-primary transition-colors cursor-pointer">Help Center</span></li>
            <li><span className="hover:text-primary transition-colors cursor-pointer">Contact Us</span></li>
            <li><span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span></li>
            <li><span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-secondary-foreground/10 text-center text-sm text-secondary-foreground/50">
        &copy; {new Date().getFullYear()} IndiaConnect. All rights reserved. Built for showcase.
      </div>
    </footer>
  );
}