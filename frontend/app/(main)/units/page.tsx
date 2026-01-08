'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Plus, Trash2, Edit2, Building2, MapPin, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UnitsPage() {
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        companyId: '' // Added companyId
    });
    const [tenants, setTenants] = useState<any[]>([]);

    const loadData = async () => {
        try {
            const [unitsData, tenantsData] = await Promise.all([
                fetchApi('/units'),
                fetchApi('/tenants').catch(() => [])
            ]);
            setUnits(unitsData);
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
            if (editingId) {
                await fetchApi(`/units/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                await fetchApi('/units', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', address: '', phone: '', companyId: '' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'Falha ao salvar unidade');
        }
    };

    const handleEdit = (unit: any) => {
        setEditingId(unit.id);
        setFormData({ name: unit.name, address: unit.address || '', phone: unit.phone || '', companyId: unit.companyId || '' });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir esta unidade?')) return;
        try {
            await fetchApi(`/units/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            alert('Falha ao excluir unidade');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', address: '', phone: '', companyId: '' });
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Unidades e Filiais</h1>
                    <p className="text-muted-foreground">Gerencie os locais físicos e filiais da sua empresa.</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', address: '', phone: '', companyId: '' }); }}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl flex items-center gap-2 font-semibold hover:ring-4 hover:ring-primary/20 transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" /> Nova Unidade
                </button>
            </header>

            {showForm && (
                <div className="bg-card p-8 rounded-2xl border shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Building2 size={24} /></div>
                            <h2 className="text-xl font-bold">{editingId ? 'Editar Unidade' : 'Cadastrar Unidade'}</h2>
                        </div>
                        <button onClick={handleCancel} className="p-2 hover:bg-muted rounded-full transition-colors"><X /></button>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-6">
                        {tenants.length > 0 && !editingId && (
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1.5 lg:col-span-1">
                                <label className="text-sm font-semibold ml-1">Nome da Unidade / Filial</label>
                                <input
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-muted/30 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                    required placeholder="Ex: Filial São Paulo - Centro"
                                />
                            </div>
                            <div className="space-y-1.5 lg:col-span-1">
                                <label className="text-sm font-semibold ml-1">Telefone / Contato</label>
                                <input
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-muted/30 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                            <div className="space-y-1.5 lg:col-span-1 md:col-span-2">
                                <label className="text-sm font-semibold ml-1">Endereço Completo</label>
                                <input
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-muted/30 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                    placeholder="Rua, Número, Bairro, Cidade - UF"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={handleCancel} className="px-6 py-3 rounded-xl text-sm font-semibold hover:bg-muted transition-colors">Cancelar</button>
                            <button type="submit" className="bg-primary text-primary-foreground px-10 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Salvar Unidade</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {units.length === 0 && (
                        <div className="col-span-full py-20 text-center text-muted-foreground italic bg-muted/10 rounded-2xl border border-dashed">
                            Nenhuma unidade cadastrada.
                        </div>
                    )}
                    {units.map((unit) => (
                        <div key={unit.id} className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group relative border-l-4 border-l-primary">
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-primary/5 rounded-xl">
                                    <Building2 className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(unit)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                    </button>
                                    <button onClick={() => handleDelete(unit.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 space-y-3">
                                <h3 className="text-lg font-bold text-foreground truncate">{unit.name}</h3>

                                <div className="space-y-1.5">
                                    {unit.phone && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Phone size={14} className="text-primary/70" /> {unit.phone}
                                        </div>
                                    )}
                                    {unit.address && (
                                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <MapPin size={14} className="text-primary/70 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{unit.address}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-3 border-t flex items-center justify-between">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Desde {new Date(unit.created_at).toLocaleDateString()}</p>
                                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
