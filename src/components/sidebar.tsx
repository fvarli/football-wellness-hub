"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Heart,
  Activity,
  AlertTriangle,
  BarChart3,
  Settings,
  X,
  Shield,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Players", href: "/players", icon: Users },
  { label: "Wellness", href: "/wellness", icon: Heart },
  { label: "Workload", href: "/workload", icon: Activity },
  { label: "Injury Risk", href: "/injury-risk", icon: AlertTriangle },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-sidebar-bg
          transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Shield className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-base font-semibold text-white tracking-tight">
              Wellness Hub
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-text hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 space-y-0.5 px-3">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-colors duration-150
                  ${
                    isActive
                      ? "bg-white/10 text-sidebar-text-active"
                      : "text-sidebar-text hover:bg-white/5 hover:text-sidebar-text-active"
                  }
                `}
              >
                <Icon className={`h-[18px] w-[18px] ${isActive ? "text-accent" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
              FC
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">FC Demo</p>
              <p className="text-xs text-sidebar-text">Coach View</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
