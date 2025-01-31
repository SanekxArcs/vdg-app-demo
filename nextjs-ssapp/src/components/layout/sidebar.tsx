'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutDashboard, Package, FolderKanban, Settings, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    label: 'Materials',
    icon: Package,
    href: '/materials',
  },
  {
    label: 'Projects',
    icon: FolderKanban,
    href: '/projects',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
  {
    label: 'Notifications',
    icon: Bell,
    href: '/notifications',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-secondary/10 text-white">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">Material Management</h2>
        <div className="space-y-1 flex flex-col">
          {routes.map((route) => (
            <Link key={route.href} href={route.href}>
              <Button
                variant={pathname === route.href ? "secondary" : "ghost"}
                className={cn("w-full   justify-start", {
                  "bg-secondary text-slate-950": pathname === route.href,
                })}
              >
                <route.icon className="mr-2 h-4 w-4" />
                {route.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}