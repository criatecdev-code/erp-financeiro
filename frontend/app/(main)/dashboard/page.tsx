'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Shield, TrendingUp, AlertCircle, DollarSign, Calendar, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [breakdown, setBreakdown] = useState<any>(null);
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const [statsData, breakdownData, recentData] = await Promise.all([
                    fetchApi('/payables/stats'),
                    fetchApi('/reports/dashboard-details'),
                    fetchApi('/payables')
                ]);
                setStats(statsData);
                setBreakdown(breakdownData);
                // Limit to 5 most recent
                setRecent(recentData.slice(0, 5));
            } catch (err) {
                console.error('Failed to load dashboard', err);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
                    <p className="text-muted-foreground">Visão geral da sua empresa em tempo real.</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Vencendo Hoje', value: formatCurrency(stats?.totalToday || 0), color: 'text-amber-600', icon: AlertCircle, bg: 'bg-amber-500/10' },
                    { label: 'Vencidos', value: formatCurrency(stats?.totalOverdue || 0), color: 'text-red-600', icon: AlertCircle, bg: 'bg-red-600/10' },
                    { label: 'Previsto (Mês)', value: formatCurrency(stats?.totalMonthExpected || 0), color: 'text-blue-600', icon: Calendar, bg: 'bg-blue-600/10' },
                    { label: 'Pago (Mês)', value: formatCurrency(stats?.totalMonthPaid || 0), color: 'text-green-600', icon: CheckCircle, bg: 'bg-green-600/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-lg transition-all border-l-4" style={{ borderColor: 'transparent', borderLeftColor: stat.color.includes('amber') ? '#d97706' : stat.color.includes('red') ? '#dc2626' : stat.color.includes('blue') ? '#2563eb' : '#16a34a' }}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                            <div className={cn("p-2 rounded-lg", stat.bg)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                        </div>
                        <div className={cn("text-2xl font-bold tracking-tight", stat.color)}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Breakdown Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Por Unidade */}
                <div className="bg-card rounded-2xl border shadow-sm p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" /> Contas por Unidade/Filial
                    </h3>
                    <div className="space-y-4">
                        {breakdown?.byUnit.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col gap-2 p-3 bg-muted/20 rounded-xl">
                                <div className="flex justify-between items-center font-semibold text-sm">
                                    <span>{item.name}</span>
                                    <span>{formatCurrency(item.total)}</span>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <span className="bg-green-500/10 text-green-600 px-2 py-0.5 rounded-md font-medium border border-green-500/20">Pago: {formatCurrency(item.paid)}</span>
                                    <span className="bg-red-500/10 text-red-600 px-2 py-0.5 rounded-md font-medium border border-red-500/20">Aberto: {formatCurrency(item.payable)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                                    <div className="h-full bg-green-500" style={{ width: `${(item.paid / (item.total || 1)) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                        {breakdown?.byUnit.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>}
                    </div>
                </div>

                {/* Por Categoria */}
                <div className="bg-card rounded-2xl border shadow-sm p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" /> Contas por Categoria
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {breakdown?.byCategory.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-muted/20 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{item.name}</span>
                                    <div className="flex gap-2 text-[10px] mt-1">
                                        <span className="text-green-600 font-bold">PG: {formatCurrency(item.paid)}</span>
                                        <span className="text-red-600 font-bold">AB: {formatCurrency(item.payable)}</span>
                                    </div>
                                </div>
                                <span className="font-bold text-sm bg-background px-3 py-1 rounded-lg border shadow-sm">{formatCurrency(item.total)}</span>
                            </div>
                        ))}
                        {breakdown?.byCategory.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>}
                    </div>
                </div>
            </div>

            {/* Comparison Month Current vs Next */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 dark:bg-indigo-950/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm">
                    <h4 className="text-indigo-900 dark:text-indigo-300 font-bold text-sm uppercase tracking-wide mb-2">Resumo deste Mês</h4>
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Total (Pago + Aberto)</span>
                            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(breakdown?.currentMonth?.total || 0)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-green-600">Pago: {formatCurrency(breakdown?.currentMonth?.paid || 0)}</div>
                            <div className="text-sm font-semibold text-red-600">A Pagar: {formatCurrency(breakdown?.currentMonth?.payable || 0)}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-900 shadow-sm">
                    <h4 className="text-purple-900 dark:text-purple-300 font-bold text-sm uppercase tracking-wide mb-2">Previsão Próximo Mês</h4>
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Total a Vencer</span>
                            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{formatCurrency(breakdown?.nextMonth?.total || 0)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">Planejamento</div>
                            <div className="text-sm font-bold text-purple-600">A Pagar: {formatCurrency(breakdown?.nextMonth?.payable || 0)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg">Últimos Lançamentos</h3>
                    <button className="text-sm text-primary font-medium hover:underline">Ver todos</button>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">Fornecedor</th>
                                <th className="px-6 py-4 font-medium">Vencimento</th>
                                <th className="px-6 py-4 font-medium">Pagamento</th>
                                <th className="px-6 py-4 font-medium">Categoria</th>
                                <th className="px-6 py-4 font-medium text-right">Valor</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {recent.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                        Nenhum lançamento recente encontrado.
                                    </td>
                                </tr>
                            )}
                            {recent.map((row, i) => {
                                const isPaid = !!row.payment_date;
                                const isOverdue = !isPaid && new Date(row.due_date) < new Date();
                                return (
                                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{row.suppliers?.name || '---'}</td>
                                        <td className="px-6 py-4">{new Date(row.due_date).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {isPaid ? new Date(row.payment_date).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-md bg-muted text-xs font-semibold">{row.expense_categories?.name || 'Geral'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(row.amount)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-xs font-semibold",
                                                isPaid ? 'bg-green-100 text-green-700' :
                                                    isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            )}>
                                                {isPaid ? 'Pago' : isOverdue ? 'Vencido' : 'Aberto'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
