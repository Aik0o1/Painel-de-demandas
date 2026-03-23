"use client";

import { ReactNode } from 'react';
import { Sidebar, SidebarContent } from './Sidebar';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export function DashboardLayout({ children, fullWidth = false }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar - Now part of flex flow */}
      <Sidebar />

      {/* Main Content Area - Flex Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-40 shrink-0">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <span className="font-semibold text-lg truncate">PAINEL DE DEMANDAS</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className={`flex-1 overflow-y-auto ${fullWidth ? 'p-0' : ''}`}>
          {fullWidth ? (
            children
          ) : (
            <div className="p-3 md:p-4 lg:p-6 pt-4 md:pt-6 max-w-[1600px] mx-auto space-y-6">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
