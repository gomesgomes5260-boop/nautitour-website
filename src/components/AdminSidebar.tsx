'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Sailboat,
  MessageSquare,
  Users,
  UserPlus,
  QrCode,
  Banknote,
  Settings,
  Newspaper,
  Image as ImageIcon,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import Logo from './Logo';

type Props = {
  user: { email: string | null; name: string | null };
};

const NAV: Array<{ href: string; label: string; Icon: typeof LayoutDashboard }> = [
  { href: '/admin/overview', label: 'Visão geral', Icon: LayoutDashboard },
  { href: '/admin/reservas', label: 'Reservas', Icon: Calendar },
  { href: '/admin/manifesto', label: 'Manifesto', Icon: Sailboat },
  { href: '/admin/scan', label: 'Check-in', Icon: QrCode },
  { href: '/admin/inquiries', label: 'Inquiries', Icon: MessageSquare },
  { href: '/admin/clientes', label: 'Clientes', Icon: Users },
  { href: '/admin/vendedores', label: 'Vendedores', Icon: UserPlus },
  { href: '/admin/comissoes', label: 'Comissões', Icon: Banknote },
  { href: '/admin/financeiro', label: 'Financeiro', Icon: Banknote },
  { href: '/admin/blog', label: 'Blog', Icon: Newspaper },
  { href: '/admin/imagens', label: 'Imagens', Icon: ImageIcon },
  { href: '/admin/config', label: 'Configurações', Icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin/overview') return pathname === '/admin' || pathname.startsWith('/admin/overview');
  return pathname.startsWith(href);
}

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const displayName = user.name?.split(' ')[0] ?? user.email ?? 'Admin';
  const initials = (user.name ?? user.email ?? 'A')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <>
      {/* === MOBILE topbar === */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-16 px-5 bg-[var(--color-charcoal-900)] text-white">
        <Logo size="sm" variant="white" />
        <button
          aria-label="Menu"
          onClick={() => setOpen(true)}
          className="p-2 text-white"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* === Backdrop mobile === */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-[var(--color-charcoal-900)]/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* === Sidebar (fixed em desktop, drawer mobile) === */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[var(--color-charcoal-900)] text-white flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo + close mobile */}
        <div className="flex items-center justify-between p-5 lg:p-6 border-b border-white/10">
          <Logo size="lg" variant="white" />
          <button
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search (decorativo por enquanto) */}
        <div className="p-4">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              placeholder="Buscar reserva..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:bg-white/10 focus:border-white/20"
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/40 px-3 pt-3 pb-2">
            Operação
          </p>
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[var(--color-red-600)] text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: notifications + user + logout */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/admin/overview"
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5"
            >
              <Bell size={16} />
              <span>Notificações</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
            <div className="w-9 h-9 rounded-full bg-[var(--color-red-600)] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-[11px] text-white/50 truncate">{user.email ?? ''}</p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                aria-label="Sair"
                className="p-1.5 text-white/60 hover:text-white"
              >
                <LogOut size={15} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
