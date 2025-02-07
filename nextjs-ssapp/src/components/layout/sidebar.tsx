"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Package, FolderKanban, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Define sidebar routes with their labels, icons, and destination URLs.
const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Materials", icon: Package, href: "/materials" },
  { label: "Projects", icon: FolderKanban, href: "/projects" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

/**
 * AppSidebar component renders a themed sidebar using the composable
 * shadcn/ui sidebar components.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          {/* Sidebar header label */}
          <SidebarGroupLabel>Material Management</SidebarGroupLabel>
          <SidebarMenu>
            {routes.map((route) => (
              <SidebarMenuItem key={route.href}>
                {/* 
                  Using `asChild` so that the button renders as a Next.js Link.
                  The `isActive` prop highlights the active route.
                */}
                <SidebarMenuButton asChild isActive={pathname === route.href}>
                  <Link href={route.href}>
                    <route.icon className="mr-2 h-4 w-4" />
                    <span>{route.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
