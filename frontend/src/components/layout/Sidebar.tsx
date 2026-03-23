"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ListTodo,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  FileText,
  ShieldCheck,
  MessageSquare,
  Banknote,
  Scale,
  FolderArchive,
  Cpu
} from 'lucide-react';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { NavLink } from '@/components/NavLink';
import { signOut, useSession } from 'next-auth/react';
import { useCurrentProfile } from '@/hooks/useProfiles';
import { useSectors } from '@/hooks/useSectors';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ProfileDialog } from '@/components/dashboard/ProfileDialog';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { apiGet, apiPost } from '@/services/api';

const navItems = [
  { title: 'Painel', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Demandas', url: '/demands', icon: ListTodo },
  { title: 'Administração', url: '/admin', icon: ShieldCheck },
  { title: 'Comunicação', url: '/sectors/comunicacao', icon: MessageSquare },
  { title: 'Financeira', url: '/sectors/financeira', icon: Banknote },
  { title: 'Procuradoria', url: '/sectors/procuradoria', icon: Scale },
  { title: 'Registro', url: '/sectors/registro', icon: FolderArchive },
  { title: 'Relatórios', url: '/reports', icon: FileText },
  { title: 'TI', url: '/sectors/ti', icon: Cpu },
];

interface SidebarContentProps {
  className?: string;
  onItemClick?: () => void;
}

export function SidebarContent({ className, onItemClick }: SidebarContentProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const { profile } = useCurrentProfile();
  const { sectors } = useSectors();
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which nav items to show based on Role/Sector/Permissions
  const filteredNavItems = navItems.filter((item) => {
    if (!profile) return false;

    // Master Admin sees everything
    if (profile.role === 'MASTER_ADMIN') return true;

    // Non-admins do not see "Administração" (can be customized)
    if (item.url === '/admin') {
      const perms = profile.permissions?.admin || profile.permissions?.admin;
      return !!perms?.read;
    }

    // For sector pages, ensure the user belongs to that sector or has specific read permission
    if (item.url.startsWith('/sectors/')) {
      const targetSlug = item.url.split('/').pop();
      const sector = sectors.find((s: any) => s.slug === targetSlug);

      // Match by fixed sector assignment (ID or Slug)
      const isAssigned = profile.sector_id === sector?.id || profile.sector_id === targetSlug;

      // Match by granular permission
      const hasReadPerm = profile.permissions?.[targetSlug as string]?.read;

      return isAssigned || !!hasReadPerm;
    }

    // For other routes (Reports, etc), use specific permissions if they exist
    if (item.url === '/reports') {
      return !!profile.permissions?.relatorios?.read;
    }

    // "Painel" and "Demandas" are visible to all authenticated users
    return true;
  });

  const handleSignOut = async () => {
    await apiPost('auth/logout', {});
    await signOut({ callbackUrl: '/login' });
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (session?.user?.email) {
      return session.user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className={cn("flex flex-col h-full bg-primary text-primary-foreground", className)}>
      {/* Header */}
      <div className="px-6 pt-10 pb-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/20 backdrop-blur-sm">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-wide text-white leading-tight">Painel</h1>
            <p className="text-xs text-white/70 font-light tracking-wider uppercase">Gestão de Tarefas</p>
          </div>
          <NotificationCenter />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 no-scrollbar">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === '/dashboard'}
            className="group flex items-center px-4 py-3.5 text-sm font-medium text-white opacity-70 rounded-xl hover:bg-white/10 hover:opacity-100 transition-all duration-200"
            activeClassName="!bg-white/20 !border-l-[3px] !border-white !opacity-100 font-semibold shadow-sm"
            onClick={onItemClick}
          >
            <item.icon className="w-5 h-5 mr-3 text-white" />
            <span className="tracking-wide text-white">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-6 py-6 space-y-5 border-t border-white/10 bg-black/10">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center justify-between group cursor-pointer focus:outline-none"
        >
          <div className="flex items-center space-x-3 text-white opacity-70 group-hover:opacity-100 transition-opacity">
            {mounted && theme === 'dark' ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
            <span className="text-sm font-medium text-white">{mounted && theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </div>
          <div className="relative w-11 h-6 bg-black/20 rounded-full transition-colors duration-200 ease-in-out">
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${mounted && theme === 'dark' ? 'translate-x-5' : ''}`}></div>
          </div>
        </button>

        {/* User Profile */}
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center space-x-3 group cursor-pointer w-full text-left"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full p-0.5 bg-white/20">
              <Avatar className="w-full h-full border-2 border-primary">
                <AvatarImage src={profile?.image || ''} className="object-cover rounded-full" />
                <AvatarFallback className="bg-primary text-white text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {profile?.full_name || 'Usuário'}
            </p>
            <p className="text-xs text-white opacity-70 truncate font-mono">
              {profile?.email || user?.email}
            </p>
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 text-white opacity-70 hover:opacity-100 hover:text-red-400 transition-all group pt-2"
        >
          <LogOut className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform text-inherit" />
          <span className="text-sm font-medium text-inherit">Sair</span>
        </button>
      </div>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 h-full shrink-0 bg-primary relative overflow-hidden shadow-xl">
      {/* Content */}
      <SidebarContent className="relative z-10" />
    </aside>
  );
}
