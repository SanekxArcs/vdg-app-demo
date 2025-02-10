"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Package, FolderKanban, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NavUser } from "./nav-user";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import vdglogo from "@/../public/svgviewer-output (6).svg";

// Define sidebar routes with their labels, icons, and destination URLs.
const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Materials", icon: Package, href: "/materials" },
  { label: "Projects", icon: FolderKanban, href: "/projects" },
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Firm cost", icon: Settings, href: "/firmCosts" },
];

/**
 * AppSidebar component renders a themed sidebar using the composable
 * shadcn/ui sidebar components.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenuButton size="lg">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <GalleryVerticalEnd className="size-4" />
          
        </div>
        <p>VDG Solar Sp. z o.o</p>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {/* Sidebar header label */}

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
      <SidebarFooter>
        <Image
          src={vdglogo}
          alt="VDG Solar FMS"
          className="w-[20rem]  scale-150 h-auto"
        />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
