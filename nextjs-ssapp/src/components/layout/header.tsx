"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@/components/user-button";
import { MobileMenu } from "@/components/layout/MobileMenu"; // <— import here

export function Header() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        {/* Mobile menu trigger */}
        <MobileMenu />

        {/* Right side actions */}
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          <UserButton />
        </div>
      </div>
    </div>
  );
}
