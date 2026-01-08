'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Shield, TrendingUp, DollarSign, FileText,
    Users, Layers, ChevronLeft, ChevronRight,
    LogOut, Building2, Zap, Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ModeToggle } from './mode-toggle';
import { fetchApi } from '@/lib/api';

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        fetchApi('/users/me')
            .then(data => setUserRole(data.role))
            .catch(err => console.error('Failed to fetch user role', err));
    }, []);

    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === path;
        return pathname?.startsWith(path);
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <aside
            className={cn(
                "bg-card border-r h-screen sticky top-0 flex flex-col transition-all duration-500 ease-in-out relative group shadow-xl z-20",
                isCollapsed ? "w-20" : "w-72"
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-8 bg-primary text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 active:scale-95 z-30 border-2 border-background"
                title={isCollapsed ? "Expandir" : "Recolher"}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Logo */}
            <div className={cn(
                "p-6 flex items-center gap-3 font-extrabold text-2xl tracking-tighter border-b mb-4 overflow-hidden whitespace-nowrap bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent transition-all duration-500",
                isCollapsed && "justify-center p-4"
            )}>
                <Wallet className="w-8 h-8 flex-shrink-0 text-primary" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-4 duration-500">CONTA<span className="text-foreground">CERTA</span></span>}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-none">

                {/* Section: Principal */}
                {!isCollapsed ? (
                    <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 mt-4 px-4">Principal</div>
                ) : (
                    <div className="h-4" />
                )}

                <NavItem href="/dashboard" icon={TrendingUp} label="Dashboard" collapsed={isCollapsed} active={isActive('/dashboard')} />
                <NavItem href="/payables" icon={DollarSign} label="Contas a Pagar" collapsed={isCollapsed} active={isActive('/payables')} />
                <NavItem href="/reports" icon={FileText} label="Relatórios" collapsed={isCollapsed} active={isActive('/reports')} />

                {/* Section: Cadastros */}
                {!isCollapsed ? (
                    <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 mt-8 px-4">Cadastros</div>
                ) : (
                    <div className="h-8 border-t mx-4 my-4" />
                )}

                <NavItem href="/suppliers" icon={Users} label="Fornecedores" collapsed={isCollapsed} active={isActive('/suppliers')} />
                <NavItem href="/units" icon={Building2} label="Unidades" collapsed={isCollapsed} active={isActive('/units')} />
                <NavItem href="/categories" icon={Layers} label="Categorias" collapsed={isCollapsed} active={isActive('/categories')} />
                <NavItem href="/users" icon={Shield} label="Usuários" collapsed={isCollapsed} active={isActive('/users')} />

                {/* Section: Admin */}
                {/* Section: Admin - Only for Superadmin */}
                {userRole === 'superadmin' && (
                    <>
                        {!isCollapsed && <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 mt-8 px-4">Admin</div>}
                        <NavItem href="/admin/tenants" icon={Building2} label="Empresas" collapsed={isCollapsed} active={isActive('/admin/tenants')} />
                        <NavItem href="/admin/plans" icon={Zap} label="Planos" collapsed={isCollapsed} active={isActive('/admin/plans')} />
                    </>
                )}

            </nav>


            {/* Footer */}
            <div className="p-4 border-t bg-muted/5 flex flex-col gap-2">
                <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between px-2")}>
                    {!isCollapsed && <span className="text-xs font-bold text-muted-foreground">Tema</span>}
                    <ModeToggle />
                </div>
                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex items-center gap-3 text-sm font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 w-full px-3 py-2.5 rounded-xl transition-all duration-200",
                        isCollapsed && "justify-center px-0"
                    )}
                    title="Sair do Sistema"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>Sair</span>}
                </button>
            </div>
        </aside>
    );
}

function NavItem({ href, icon: Icon, label, collapsed, active }: any) {
    return (
        <Link
            href={href}
            className={cn(
                "group/item flex items-center gap-3 px-3 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap relative overflow-hidden",
                active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0 w-12 mx-auto"
            )}
            title={collapsed ? label : undefined}
        >
            {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20" />
            )}
            <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                !active && "group-hover/item:scale-110"
            )} />
            {!collapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{label}</span>}

            {collapsed && (
                <div className="absolute left-14 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity font-bold whitespace-nowrap shadow-xl z-50">
                    {label}
                </div>
            )}
        </Link>
    )
}
