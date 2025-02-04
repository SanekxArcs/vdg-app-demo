"use client";

import Link from "next/link";
import {
  Menu,
  LayoutDashboard,
  Package,
  FolderKanban,
  Settings,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Ваш масив маршрутів
const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Materials",
    icon: Package,
    href: "/materials",
  },
  {
    label: "Projects",
    icon: FolderKanban,
    href: "/projects",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export function MobileMenu() {
  const pathname = usePathname();

  return (
    <Sheet>
      {/* Кнопка-відкривач для мобільного меню */}
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      {/* Сам слайд-меню (SheetContent) */}
      <SheetContent
        side="left"
        className="flex flex-col p-0 bg-slate-900 text-slate-50"
      >
        {/* Шапка з назвою (можна налаштувати під себе) */}
        <div className="border-b border-slate-700 bg-slate-800 px-4 py-3 shadow-sm">
          <h2 className="text-lg font-bold tracking-wide">Navigation</h2>
          <p className="text-xs text-slate-400">Material Management</p>
        </div>

        {/* Навігаційна панель */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link key={route.href} href={route.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                      : "hover:bg-slate-800"
                  )}
                >
                  <route.icon className="mr-2 h-4 w-4" />
                  {route.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
