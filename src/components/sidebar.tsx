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
  ClipboardCheck,
  X,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Staff",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Players", href: "/players", icon: Users },
      { label: "Wellness", href: "/wellness", icon: Heart },
      { label: "Workload", href: "/workload", icon: Activity },
      { label: "Submit Check-in", href: "/check-in", icon: ClipboardCheck },
      { label: "Injury Risk", href: "/injury-risk", icon: AlertTriangle },
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Player",
    items: [
      { label: "Check-in", href: "/check-in", icon: ClipboardCheck },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userRole?: string;
  userName?: string;
}

export default function Sidebar({ open, onClose, userRole, userName }: SidebarProps) {
  const pathname = usePathname();

  // Filter sections by role
  const visibleSections = navSections.filter((section) => {
    if (!userRole) return true; // show all if no role provided
    if (section.title === "Staff") return userRole === "admin" || userRole === "coach";
    if (section.title === "Player") return userRole === "player";
    return true; // System section visible to all
  });

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
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
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

        {/* Navigation sections */}
        <nav className="mt-2 flex-1 overflow-y-auto px-3">
          {visibleSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/50">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
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
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
              FC
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{userName ?? "User"}</p>
              <p className="text-xs text-sidebar-text capitalize">{userRole ?? "—"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
