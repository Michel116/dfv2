import Link from 'next/link';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { LayoutDashboard } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" passHref>
          <AppLogo />
        </Link>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Панель
            </Link>
          </Button>
          {/* Add more navigation items here if needed */}
        </nav>
      </div>
    </header>
  );
}
