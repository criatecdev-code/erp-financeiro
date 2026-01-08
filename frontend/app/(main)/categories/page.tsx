'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Plus, Trash2, Edit2, Layers, Loader2 } from 'lucide-react';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [tenants, setTenants] = useState<any[]>([]);

    const loadData = async () => {
        try {
            const [categoriesData, tenantsData] = await Promise.all([
                fetchApi('/categories'),
                fetchApi('/tenants').catch(() => [])
            ]);
            setCategories(categoriesData);
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
            await fetchApi('/categories', {
                method: 'POST',
                body: JSON.stringify({ name: newName, companyId: companyId })
            });
            setShowForm(false);
            setNewName('');
            setCompanyId(''); // Reset companyId
            loadData();
        } catch (err: any) {
            alert(err.message || 'Falha ao criar categoria');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir esta categoria?')) return;
        try {
            await fetchApi(`/categories/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            alert('Falha ao excluir. Verifique se existem lançamentos vinculados.');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categorias de Despesa</h1>
                    <p className="text-muted-foreground">Classifique seus gastos para melhores relatórios.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" /> Nova Categoria
                </button>
            </header>

            {showForm && (
                <div className="bg-card p-6 rounded-xl border shadow-sm animate-in slide-in-from-top-4">
                    <form onSubmit={handleCreate} className="flex flex-col gap-4">
                        {tenants.length > 0 && (
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-primary">Vincular à Empresa (Superadmin)</label>
                                <select
                                    value={companyId}
                                    onChange={e => setCompanyId(e.target.value)}
                                    className="border rounded-lg p-2 bg-muted/20 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    required
                                >
                                    <option value="">Selecione uma Empresa...</option>
                                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1 text-muted-foreground">Nome da Categoria</label>
                                <input
                                    value={newName} onChange={e => setNewName(e.target.value)}
                                    className="w-full border rounded-lg p-2 bg-muted/20 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Ex: Aluguel, Marketing, Salários..."
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                            <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:opacity-90 transition-all">Salvar Categoria</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-card rounded-xl border border-dashed">
                            <Layers className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">Nenhuma categoria cadastrada.</p>
                        </div>
                    )}
                    {categories.map((c) => (
                        <div key={c.id} className="bg-card p-5 rounded-xl border shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-foreground">{c.name}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Editar">
                                    <Edit2 className="w-4 h-4 text-primary" />
                                </button>
                                <button
                                    onClick={() => handleDelete(c.id)}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
