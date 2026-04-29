'use client';

import Link from "next/link";
import { Home, Search, SquarePen, Heart, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, href: "/" },
    { icon: Search, href: "/search" },
    { icon: SquarePen, href: "/compose", className: "hidden md:block" },
    { icon: Heart, href: "/notifications" },
    { icon: User, href: "/profile" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight text-foreground">
          @
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={i} 
                href={item.href}
                className={cn(
                  "p-3 rounded-lg transition-colors hover:bg-secondary",
                  isActive ? "text-foreground" : "text-muted hover:text-foreground/80",
                  item.className
                )}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            );
          })}
        </nav>
        
        <div className="w-8" /> {/* Spacer for centering */}
      </div>
    </header>
  );
}
