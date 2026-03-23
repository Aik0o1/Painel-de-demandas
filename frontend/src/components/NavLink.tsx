"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface NavLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  end?: boolean;
  onClick?: () => void;
}

export function NavLink({ to, children, className, activeClassName, end, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = end
    ? pathname === to
    : pathname?.startsWith(to);

  return (
    <Link
      href={to}
      className={cn(className, isActive && activeClassName)}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
