'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Plus, Filter, Loader2, X, Calendar as CalendarIcon, DollarSign, Tag, Building, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PayablesPage() {
    const [payables, setPayables] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Stats
    const [stats, setStats] = useState({ totalOpen: 0, totalOverdue: 0 });

    // New Payable Form State
    const [formData, setFormData] = useState({
        supplier_id: '',
        category_id: '',
        unit_id: '',
        amount: '',
        due_date: '',
        document_number: '',
        notes: '',
        companyId: '' // Added companyId
    });
    const [tenants, setTenants] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [listData, statsData, suppliersData, categoriesData, unitsData, tenantsData] = await Promise.all([
                fetchApi('/payables'),
                fetchApi('/payables/stats'),
                fetchApi('/suppliers'),
                fetchApi('/categories'),
                fetchApi('/units'),
                fetchApi('/tenants').catch(() => [])

            ]);
            setPayables(listData);
            setStats(statsData);
            setSuppliers(suppliersData);
            setCategories(categoriesData);
            setUnits(unitsData);
            setTenants(tenantsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetchApi('/payables', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount)
                })
            });
            setShowForm(false);
            setShowForm(false);
            setFormData({ supplier_id: '', category_id: '', unit_id: '', amount: '', due_date: '', document_number: '', notes: '', companyId: '' });
            loadData();
            loadData();
        } catch (err: any) {
            alert(err.message || 'Falha ao criar lançamento');
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        if (!confirm('Deseja marcar esta conta como paga?')) return;
        try {
            await fetchApi(`/payables/${id}/pay`, {
                method: 'PATCH',
                body: JSON.stringify({ payment_date: new Date() })
            });
            loadData();
        } catch (err) {
            alert('Falha ao atualizar status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;
        try {
            await fetchApi(`/payables/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            alert('Falha ao excluir lançamento');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
                    <p className="text-muted-foreground">Gerencie seus compromissos financeiros e fluxo de caixa.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-card border px-4 py-2 rounded-xl flex items-center gap-2 font-semibold hover:bg-muted transition-all shadow-sm">
                        <Filter className="w-4 h-4" /> Filtros
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-primary/90 transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-[0px]"
                    >
                        <Plus className="w-5 h-5" /> Novo Lançamento
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border shadow-sm border-l-4 border-l-blue-500">
                    <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Total em Aberto
                    </div>
                    <div className="text-3xl font-extrabold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalOpen)}
                    </div>
                </div>
                <div className="bg-card p-6 rounded-2xl border shadow-sm border-l-4 border-l-red-500 bg-red-50/10">
                    <div className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" /> Vencidos
                    </div>
                    <div className="text-3xl font-extrabold text-red-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalOverdue)}
                    </div>
                </div>
            </div>

            {/* Form Modal / Overlay */}
            {showForm && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">Novo Lançamento</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {tenants.length > 0 && (
                                <div className="space-y-1 mb-4 p-4 bg-muted/30 rounded-xl border border-dashed border-primary/30">
                                    <label className="text-sm font-bold ml-1 text-primary">Vincular à Empresa (Superadmin)</label>
                                    <select
                                        value={(formData as any).companyId || ''}
                                        onChange={e => setFormData({ ...formData, companyId: e.target.value } as any)}
                                        className="w-full bg-card border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                        required
                                    >
                                        <option value="">Selecione uma Empresa...</option>
                                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold flex items-center gap-1.5"><Building size={14} className="text-muted-foreground" /> Fornecedor</label>
                                    <select
                                        className="w-full border rounded-xl p-2.5 bg-muted/20"
                                        required
                                        value={formData.supplier_id}
                                        onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold flex items-center gap-1.5"><Tag size={14} className="text-muted-foreground" /> Categoria</label>
                                    <select
                                        className="w-full border rounded-xl p-2.5 bg-muted/20"
                                        required
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold flex items-center gap-1.5"><Building size={14} className="text-muted-foreground" /> Unidade / Filial</label>
                                    <select
                                        className="w-full border rounded-xl p-2.5 bg-muted/20"
                                        required
                                        value={formData.unit_id}
                                        onChange={e => setFormData({ ...formData, unit_id: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold flex items-center gap-1.5"><DollarSign size={14} className="text-muted-foreground" /> Valor (R$)</label>
                                    <input
                                        type="number" step="0.01" className="w-full border rounded-xl p-2.5"
                                        required placeholder="0,00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold flex items-center gap-1.5"><CalendarIcon size={14} className="text-muted-foreground" /> Vencimento</label>
                                    <input
                                        type="date" className="w-full border rounded-xl p-2.5"
                                        required
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Observações</label>
                                <textarea
                                    className="w-full border rounded-xl p-2.5 h-24"
                                    placeholder="Detalhes adicionais..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 font-semibold hover:bg-muted rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all">Salvar Conta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                <tr>
                                    <th className="px-6 py-5">Vencimento</th>
                                    <th className="px-6 py-5">Fornecedor</th>
                                    <th className="px-6 py-5">Categoria</th>
                                    <th className="px-6 py-5">Unidade</th>
                                    <th className="px-6 py-5 text-right">Valor</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                    <th className="px-6 py-5 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payables.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                                            Nenhum lançamento encontrado. Clique em "Novo Lançamento" para começar.
                                        </td>
                                    </tr>
                                )}
                                {payables.map((p) => {
                                    const isPaid = !!p.payment_date;
                                    const isOverdue = !isPaid && new Date(p.due_date) < new Date();
                                    return (
                                        <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4 font-semibold text-foreground">
                                                {new Date(p.due_date).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 font-medium">{p.suppliers?.name || '---'}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-muted/50 px-3 py-1 rounded-lg text-[11px] font-bold text-muted-foreground">
                                                    {p.expense_categories?.name || 'Geral'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                                    <Building size={12} className="opacity-50" />
                                                    {p.units?.name || 'S/ Unidade'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-foreground font-mono">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tight",
                                                    isPaid ? 'bg-green-100 text-green-700' :
                                                        isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                )}>
                                                    {isPaid ? 'PAGO' : isOverdue ? 'VENCIDO' : 'ABERTO'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!isPaid && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(p.id)}
                                                        className="text-xs font-bold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg transition-all"
                                                    >
                                                        Pagar
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="ml-2 p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
