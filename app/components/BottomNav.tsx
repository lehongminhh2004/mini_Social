'use client';

import Link from "next/link";
import { Home, Search, SquarePen, Heart, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, href: "/" },
    { icon: Search, href: "/search" },
    { icon: SquarePen, href: "/compose" },
    { icon: Heart, href: "/notifications" },
    { icon: User, href: "/profile" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={i} 
              href={item.href}
              className={cn(
                "p-3 transition-colors",
                isActive ? "text-foreground" : "text-muted hover:text-foreground/80"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
