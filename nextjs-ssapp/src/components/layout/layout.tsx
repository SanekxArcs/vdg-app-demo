"use client";

import { AppSidebar } from "@/components/layout/sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";
import { LiveBreadcrumb } from "@/components/layout/LiveBreadcrumb"; // Import the dynamic breadcrumb

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-right" richColors />
      <SidebarProvider>
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <SidebarInset>
          {/* Header with dynamic Breadcrumb and Sidebar Toggle */}
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              {/* Dynamic Breadcrumb Component */}
              <LiveBreadcrumb />
            </div>
            <div className="ml-auto space-x-4 pr-5">
              <ModeToggle />
            </div>
          </header>

          {/* Main Content Wrapper */}
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-screen overflow-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
