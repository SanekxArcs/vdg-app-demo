'use client';

import { Header } from './header';
import { Sidebar } from './sidebar';
import { Toaster } from "sonner";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
    <Toaster position="top-right" richColors />
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-gray-900">
        <Sidebar />
      </div>
      <main className="md:pl-72">
        <Header />
        {children}
      </main>
    </div>
    </>
    
  );
}