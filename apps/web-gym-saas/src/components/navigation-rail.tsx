"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  ShoppingCart, 
  Calendar, 
  Settings, 
  LogOut,
  ScanLine,
  Sparkles,
  GitBranch,
  Building2,
  CheckSquare,
  Radio,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";

const navigationItems = [
  {
    name: "Reception",
    href: "/reception",
    icon: ScanLine,
    description: "Check-in monitor",
  },
  {
    name: "Members",
    href: "/members",
    icon: Users,
    description: "Member CRM",
  },
  {
    name: "Corporate B2B",
    href: "/admin/corporate",
    icon: Building2,
    description: "Employer billing",
  },
  {
    name: "Sales & Leads",
    href: "/members/leads",
    icon: GitBranch,
    description: "Pipeline & referrals",
  },
  {
    name: "POS",
    href: "/pos",
    icon: ShoppingCart,
    description: "Point of sale",
  },
  {
    name: "Schedule",
    href: "/calendar",
    icon: Calendar,
    description: "Classes & conflicts",
  },
  {
    name: "Messaging & SMS",
    href: "/communications",
    icon: Radio,
    description: "Africa's Talking & WhatsApp",
  },
  {
    name: "Staff Tasks",
    href: "/admin/tasks",
    icon: CheckSquare,
    description: "Task automations",
  },
  {
    name: "Canvas",
    href: "/marketing/canvas",
    icon: Sparkles,
    description: "Visual Campaign Builder",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Configuration",
  },
];

export function NavigationRail() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile navigation drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeItem = navigationItems.find(
    (item) => pathname === item.href || (pathname?.startsWith(item.href + '/') && item.href !== '/')
  );

  return (
    <>
      {/* Mobile Top Header Bar (< lg) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-foreground hover:bg-muted focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <PolyFitLogo theme="dark" iconSize={28} showWordmark={true} />
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live
            </span>
          </div>
        </div>

        {activeItem && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 truncate max-w-[120px] sm:max-w-[180px]">
            {activeItem.name}
          </span>
        )}
      </header>

      {/* Mobile Drawer Overlay Backdrop (< lg) */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar (Desktop fixed + Mobile slide-over drawer) */}
      <nav
        className={cn(
          "fixed left-0 top-0 bottom-0 w-[240px] bg-surface border-r border-border flex flex-col z-50 transition-transform duration-200 ease-in-out",
          "lg:translate-x-0", // Always visible on desktop
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0" // Slide-over on mobile
        )}
      >
        {/* Logo/Brand */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PolyFitLogo theme="dark" iconSize={32} showWordmark={true} />
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Operations Console</p>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close Navigation Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && item.href !== '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group min-h-[44px]",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            href="/monitor"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
          >
            <ScanLine className="w-5 h-5 shrink-0" />
            <span className="truncate">Reception Monitor</span>
          </Link>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors min-h-[44px]"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="truncate">Exit to Home</span>
          </button>
        </div>
      </nav>
    </>
  );
}
