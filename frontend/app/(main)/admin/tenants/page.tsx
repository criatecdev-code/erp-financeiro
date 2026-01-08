'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { createClient } from '@/lib/supabase';
import { Plus, UserPlus, Building2, UserCheck, Mail, Phone, MapPin, Trash2, Edit2, X } from 'lucide-react';

export default function TenantsPage() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        address: '',
        phone: '',
        email: ''
    });

    // Link User State
    const [showLinkUser, setShowLinkUser] = useState<string | null>(null); // tenantId
    const [linkUserId, setLinkUserId] = useState('');

    const loadData = async () => {
        try {
            const data = await fetchApi('/tenants');
            setTenants(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // Get current user ID
        const getUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        getUser();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await fetchApi(`/tenants/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                await fetchApi('/tenants', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', cnpj: '', address: '', phone: '', email: '' });
            loadData();
        } catch (err) {
            alert('Failed to save tenant');
        }
    };

    const handleEdit = (tenant: any) => {
        setEditingId(tenant.id);
        setFormData({
            name: tenant.name,
            cnpj: tenant.cnpj,
            address: tenant.address || '',
            phone: tenant.phone || '',
            email: tenant.email || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir esta empresa? Esta ação é irreversível.')) return;
        try {
            await fetchApi(`/tenants/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'Falha ao excluir empresa');
        }
    };

    const handleLinkUser = async (e: React.FormEvent, userIdOverride?: string) => {
        e?.preventDefault();
        const uid = userIdOverride || linkUserId;
        if (!uid) return alert('User ID missing');

        try {
            await fetchApi('/tenants/link-user', {
                method: 'POST',
                body: JSON.stringify({ userId: uid, companyId: showLinkUser, role: 'admin' })
            });
            setShowLinkUser(null);
            setLinkUserId('');
            alert('User Linked successfully! You can now access this tenant\'s data.');
        } catch (err) {
            alert('Failed to link user.');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Gestão de Empresas</h1>
                    <p className="text-muted-foreground">Superadmin: Controle global de tenants e acessos.</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', cnpj: '', address: '', phone: '', email: '' }); }}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:ring-4 hover:ring-primary/20 transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Nova Empresa
                </button>
            </header>

            {showForm && (
                <div className="bg-card p-8 rounded-2xl border shadow-xl mb-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Building2 size={24} /></div>
                            <h3 className="font-bold text-xl">{editingId ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}</h3>
                        </div>
                        <button onClick={() => setShowForm(false)} className="p-2 hover:bg-muted rounded-full"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold ml-1">Razão Social / Nome Fantasia</label>
                                <input
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    required placeholder="Ex: Minha Empresa Ltda"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold ml-1">CNPJ</label>
                                <input
                                    value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                    className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    required placeholder="00.000.000/0000-00"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold ml-1">E-mail de Contato</label>
                                <input
                                    type="email"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="corporativo@empresa.com"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold ml-1">Telefone</label>
                                <input
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-sm font-semibold ml-1">Endereço Completo</label>
                                <input
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="Rua, Número, Bairro, Cidade - UF"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-semibold hover:bg-muted rounded-xl transition-all">Cancelar</button>
                            <button type="submit" className="bg-primary text-primary-foreground px-10 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">Salvar Empresa</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div>Carregando...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tenants.map(t => (
                        <div key={t.id} className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-secondary/10 text-secondary rounded-lg">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1">
                                    {/* Link Self Button */}
                                    <button
                                        onClick={() => {
                                            // We set state then immediately call
                                            // But since state setting is async, better to pass ID directly
                                            // Actually we need 'showLinkUser' to be set for the ID reference in handleLinkUser
                                            // Let's modify handleLinkUser to accept params
                                            setShowLinkUser(t.id);
                                            // setTimeout hack or just pass everything to function

                                            // Direct API call safely:
                                            if (confirm('Deseja vincular sua conta a esta empresa?')) {
                                                fetchApi('/tenants/link-user', {
                                                    method: 'POST',
                                                    body: JSON.stringify({ userId: currentUserId, companyId: t.id, role: 'admin' })
                                                }).then(() => alert('Vinculado com sucesso!'))
                                                    .catch(() => alert('Erro ao vincular.'));
                                            }
                                        }}
                                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg flex items-center gap-1 text-xs font-bold border border-transparent hover:border-green-100"
                                        title="Vincular a Mim (Superadmin)"
                                    >
                                        <UserCheck className="w-4 h-4" /> Eu
                                    </button>

                                    <button
                                        onClick={() => setShowLinkUser(showLinkUser === t.id ? null : t.id)}
                                        className="text-primary hover:bg-primary/10 p-2 rounded-lg flex items-center gap-1 text-xs font-medium"
                                    >
                                        <UserPlus className="w-4 h-4" /> Outro
                                    </button>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(t)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-1">{t.name}</h3>
                            <p className="text-sm text-muted-foreground font-mono mb-4">{t.cnpj}</p>

                            <div className="space-y-2 mb-6">
                                {t.email && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Mail size={14} className="text-primary/70" /> {t.email}
                                    </div>
                                )}
                                {t.phone && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone size={14} className="text-primary/70" /> {t.phone}
                                    </div>
                                )}
                                {t.address && (
                                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <MapPin size={14} className="text-primary/70 mt-0.5 flex-shrink-0" />
                                        <span>{t.address}</span>
                                    </div>
                                )}
                            </div>

                            <div className="text-[10px] text-muted-foreground border-t pt-4 flex justify-between items-center">
                                <span>ID: {t.id}</span>
                                <span className="bg-muted px-2 py-0.5 rounded uppercase font-bold">Ativo</span>
                            </div>

                            {showLinkUser === t.id && (
                                <div className="mt-4 pt-4 border-t bg-muted/30 -mx-6 -mb-6 p-4 animate-in fade-in">
                                    <form onSubmit={(e) => handleLinkUser(e)} className="flex gap-2">
                                        <input
                                            value={linkUserId} onChange={e => setLinkUserId(e.target.value)}
                                            placeholder="UUID do Usuário"
                                            className="flex-1 text-xs p-2 border rounded"
                                            required
                                        />
                                        <button type="submit" className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded font-bold">
                                            Salvar
                                        </button>
                                    </form>
                                    <p className="text-[10px] text-muted-foreground mt-2">
                                        Copie o User ID do Supabase Auth e cole aqui para tornar este usuário o Admin desta empresa.
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
