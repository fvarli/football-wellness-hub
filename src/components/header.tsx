"use client";

import { Menu, Bell, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-card-border bg-card-bg px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-muted hover:bg-gray-100 hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-md p-2 text-muted hover:bg-gray-100 hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md p-2 text-muted hover:bg-gray-100 hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
