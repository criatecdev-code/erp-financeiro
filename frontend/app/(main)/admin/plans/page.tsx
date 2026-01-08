'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Plus, Trash2, Edit2, Check, X, Shield, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        features: '',
        interval: 'monthly'
    });

    const loadData = async () => {
        try {
            const data = await fetchApi('/plans');
            setPlans(data);
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
            await fetchApi('/plans', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    features: formData.features.split('\n').filter(f => f.trim())
                })
            });
            setShowForm(false);
            setFormData({ name: '', price: '', description: '', features: '', interval: 'monthly' });
            loadData();
        } catch (err) {
            alert('Falha ao criar plano');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir este plano?')) return;
        try {
            await fetchApi(`/plans/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            alert('Falha ao excluir plano');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Gestão de Planos SaaS</h1>
                    <p className="text-muted-foreground">Superadmin: Configure as ofertas e preços do sistema.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:ring-4 hover:ring-primary/20 transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Novo Plano
                </button>
            </header>

            {showForm && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
                            <h2 className="text-xl font-bold">Configurar Novo Plano</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold ml-1">Nome do Plano</label>
                                    <input
                                        className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        required placeholder="Ex: Premium, Pro, Business"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold ml-1">Preço Mensal (R$)</label>
                                    <input
                                        type="number" step="0.01" className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        required placeholder="0.00"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-sm font-semibold ml-1">Descrição Curta</label>
                                    <input
                                        className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="Ideal para pequenas empresas..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-sm font-semibold ml-1">Funcionalidades (Uma por linha)</label>
                                    <textarea
                                        className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all min-h-[120px]"
                                        placeholder="Usuarios Ilimitados&#10;Suporte 24h&#10;Relatorios Avancados"
                                        value={formData.features}
                                        onChange={e => setFormData({ ...formData, features: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-semibold hover:bg-muted rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="bg-primary text-primary-foreground px-10 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">Criar Plano</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Zap className="w-8 h-8 animate-pulse text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-card border-2 rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-primary/50 transition-all shadow-sm hover:shadow-xl">
                            {plan.price > 100 && (
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-black uppercase px-6 py-1.5 rotate-45 translate-x-[40px] translate-y-[20px] shadow-lg">
                                    Popular
                                </div>
                            )}
                            <div className="mb-8">
                                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-black">R$ {plan.price}</span>
                                    <span className="text-muted-foreground font-semibold">/mês</span>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="space-y-4 flex-1 mb-8">
                                {plan.features?.map((f: string, i: number) => (
                                    <div key={i} className="flex gap-3 text-sm font-semibold">
                                        <div className="mt-0.5 p-0.5 bg-emerald-500/10 rounded-full text-emerald-600">
                                            <Check size={14} />
                                        </div>
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t flex gap-2">
                                <button className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2">
                                    <Edit2 size={16} /> Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="p-2.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
