'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { createClient } from '@/lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Calendar, Download, Filter, TrendingDown,
    CheckCircle, AlertCircle, DollarSign, Building,
    Tag, Users as UsersIcon, Loader2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        categoryId: '',
        unitId: '',
        companyId: '',
        dateType: 'due_date' // 'due_date' or 'created_at'
    });

    // Dropdown Data
    const [categories, setCategories] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]); // For Superadmin

    const loadReport = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.month) queryParams.append('month', filters.month);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
            if (filters.unitId) queryParams.append('unitId', filters.unitId);
            if (filters.companyId) queryParams.append('companyId', filters.companyId);
            if (filters.dateType) queryParams.append('dateType', filters.dateType);

            const result = await fetchApi(`/reports/summary?${queryParams.toString()}`);
            setData(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return alert('Sessão expirada');

            const queryParams = new URLSearchParams();
            if (filters.month) queryParams.append('month', filters.month);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
            if (filters.unitId) queryParams.append('unitId', filters.unitId);
            if (filters.companyId) queryParams.append('companyId', filters.companyId);
            if (filters.dateType) queryParams.append('dateType', filters.dateType);

            const res = await fetch(`http://localhost:3001/api/reports/export?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!res.ok) throw new Error('Falha no download');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio-${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            alert('Falha ao baixar relatório');
        }
    };

    const loadOptions = async () => {
        try {
            const [cats, uns] = await Promise.all([
                fetchApi('/categories'),
                fetchApi('/units')
            ]);
            setCategories(cats);
            setUnits(uns);
            // Optionally fetch tenants if superadmin (not implemented in frontend check yet)
        } catch (e) {
            console.error("Failed to load options", e);
        }
    }

    useEffect(() => {
        loadOptions();
        loadReport();
    }, []);

    const formatCurrency = (val: number | undefined) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const pieData = [
        { name: 'Pago', value: data?.byStatus?.paid || 0, color: '#10b981' },
        { name: 'Pendente', value: data?.byStatus?.pending || 0, color: '#f59e0b' }
    ].filter(d => d.value > 0);

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
                    <p className="text-muted-foreground">Análise detalhada de despesas e fluxo de caixa.</p>
                </div>

                <div className="flex flex-col gap-4 w-full md:w-auto">
                    <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-2xl border shadow-sm">

                        {/* Date Type Filter */}
                        <div className="flex items-center gap-2 border-r pr-3">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Filtrar Por</span>
                            <select
                                className="bg-transparent text-sm font-semibold outline-none cursor-pointer"
                                value={filters.dateType}
                                onChange={e => setFilters({ ...filters, dateType: e.target.value })}
                            >
                                <option value="due_date">Vencimento</option>
                                <option value="created_at">Lançamento</option>
                            </select>
                        </div>

                        {/* Month Filter */}
                        <div className="flex items-center gap-2 border-r pr-3">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Mês</span>
                            <input
                                type="month"
                                className="bg-transparent text-sm font-semibold outline-none"
                                value={filters.month}
                                onChange={e => setFilters({ ...filters, month: e.target.value, startDate: '', endDate: '' })}
                            />
                        </div>

                        {/* Category Filter */}
                        <select
                            className="bg-transparent text-sm font-medium outline-none max-w-[120px]"
                            value={filters.categoryId}
                            onChange={e => setFilters({ ...filters, categoryId: e.target.value })}
                        >
                            <option value="">Todas Categorias</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        {/* Unit Filter */}
                        <select
                            className="bg-transparent text-sm font-medium outline-none max-w-[120px]"
                            value={filters.unitId}
                            onChange={e => setFilters({ ...filters, unitId: e.target.value })}
                        >
                            <option value="">Todas Unidades</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>

                        <button
                            onClick={loadReport}
                            className="bg-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-all"
                            title="Aplicar Filtros"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Advanced Date Range Toggle (Optional - kept simple for now) */}
                    {(filters.startDate || filters.endDate) && (
                        <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded-lg self-end">
                            <span>Período Personalizado Ativo</span>
                            <button onClick={() => setFilters({ ...filters, startDate: '', endDate: '' })}><X className="w-3 h-3" /></button>
                        </div>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium animate-pulse">Gerando relatórios...</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total no Período', value: data.total, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                            { label: 'Total Pago', value: data.byStatus.paid, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                            { label: 'Total Pendente', value: data.byStatus.pending, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                            { label: 'Total Vencido', value: data.byStatus.overdue, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-500/10' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("p-2 rounded-xl", stat.bg)}>
                                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                                </div>
                                <div className={cn("text-2xl font-black tracking-tight", stat.color)}>
                                    {formatCurrency(stat.value)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* By Category Bar Chart */}
                        <div className="bg-card p-8 rounded-2xl border shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg"><Tag className="w-5 h-5 text-primary" /></div>
                                <h3 className="font-bold text-lg">Despesas por Categoria</h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.byCategory}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `R$ ${val}`} />
                                        <Tooltip
                                            cursor={{ fill: '#f3f4f6' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val: any) => [formatCurrency(val), 'Total']}
                                        />
                                        <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Status Pie Chart */}
                        <div className="bg-card p-8 rounded-2xl border shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg"><CheckCircle className="w-5 h-5 text-primary" /></div>
                                <h3 className="font-bold text-lg">Distribuição de Status</h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val: any) => formatCurrency(val)}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* By Supplier Bar Chart */}
                        <div className="bg-card p-8 rounded-2xl border shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg"><UsersIcon className="w-5 h-5 text-primary" /></div>
                                <h3 className="font-bold text-lg">Maiores Fornecedores</h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.bySupplier} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={100} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val: any) => formatCurrency(val)}
                                        />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={25} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* By Unit Bar Chart */}
                        <div className="bg-card p-8 rounded-2xl border shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg"><Building className="w-5 h-5 text-primary" /></div>
                                <h3 className="font-bold text-lg">Despesas por Unidade</h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.byUnit}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val: any) => formatCurrency(val)}
                                        />
                                        <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
