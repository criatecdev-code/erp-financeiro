'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Plus, Trash2, Edit2, Shield } from 'lucide-react';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        document: '',
        phone: '',
        email: '',
        address: '',
        companyId: '', // Added companyId to formData
    });
    // State for Tenants (Superadmin)
    const [tenants, setTenants] = useState<any[]>([]);

    const loadData = async () => {
        try {
            const [suppliersData, tenantsData] = await Promise.all([
                fetchApi('/suppliers'),
                fetchApi('/tenants').catch(() => []) // Ignore error if not superadmin
            ]);
            setSuppliers(suppliersData);
            setTenants(tenantsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetchApi('/suppliers', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            setShowForm(false);
            setFormData({ name: '', document: '', phone: '', email: '', address: '', companyId: '' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'Falha ao cadastrar fornecedor');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
                    <p className="text-muted-foreground">Gerencie seus parceiros e contatos comerciais.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl flex items-center gap-2 font-semibold hover:ring-4 hover:ring-primary/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Novo Fornecedor
                </button>
            </header>

            {showForm && (
                <div className="bg-card p-8 rounded-2xl border shadow-xl animate-in fade-in zoom-in-95 duration-300">
                    <h2 className="text-xl font-bold mb-6">Cadastrar Parceiro</h2>
                    <form onSubmit={handleCreate} className="space-y-6">
                        {tenants.length > 0 && (
                            <div className="space-y-2 mb-4 p-4 bg-muted/30 rounded-xl border border-dashed border-primary/30">
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
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-1">Nome / Razão Social</label>
                                <input
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-muted/30 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                    required placeholder="Ex: ABC Tecnologia Ltda"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-1">CNPJ / CPF</label>
                                <input
                                    value={formData.document} onChange={e => setFormData({ ...formData, document: e.target.value })}
                                    className="w-full bg-muted/30 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none transition-all font-mono"
                                    placeholder="00.000.000/0000-00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-1">Telefone / WhatsApp</label>
                                <input
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-muted/30 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-1">
                                <label className="text-sm font-semibold ml-1">E-mail</label>
                                <input
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    type="email"
                                    className="w-full bg-muted/30 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="contato@empresa.com"
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <label className="text-sm font-semibold ml-1">Endereço Completo</label>
                                <input
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-muted/30 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="Rua, Número, Bairro, Cidade - UF"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors">Cancelar</button>
                            <button type="submit" className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Salvar Fornecedor</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-muted/50 text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-b">
                                <tr>
                                    <th className="px-6 py-5">Parceiro</th>
                                    <th className="px-6 py-5">Documento</th>
                                    <th className="px-6 py-5">Contato</th>
                                    <th className="px-6 py-5">Localização</th>
                                    <th className="px-6 py-5 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {suppliers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                            Nenhum fornecedor encontrado.
                                        </td>
                                    </tr>
                                )}
                                {suppliers.map((s) => (
                                    <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-foreground">
                                            {s.name}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs opacity-70 italic">
                                            {s.document || '---'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold">{s.phone || '---'}</span>
                                                <span className="text-[10px] text-muted-foreground lowercase truncate max-w-[150px]">{s.email || ''}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-muted-foreground truncate block max-w-[200px]" title={s.address}>
                                                {s.address || '---'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-primary/10 rounded-xl transition-colors">
                                                <Edit2 className="w-4 h-4 text-primary" />
                                            </button>
                                            <button className="p-2 hover:bg-destructive/10 rounded-xl transition-colors">
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
