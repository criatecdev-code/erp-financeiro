'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { User, Shield, UserCheck, Mail, Calendar, Plus, X, Phone, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'visualizacao',
        phone: '',
        companyId: '' // Added companyId
    });

    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

    const handleEdit = (user: any) => {
        setEditingId(user.id);
        setFormData({
            name: user.name,
            email: user.email || '',
            password: '',
            role: user.role,
            phone: user.phone || '',
            companyId: user.company_id || ''
        });
        setShowForm(true);
    };
    const [tenants, setTenants] = useState<any[]>([]);

    const loadData = async () => {
        try {
            const [usersData, tenantsData, meData] = await Promise.all([
                fetchApi('/users'),
                fetchApi('/tenants').catch(() => []),
                fetchApi('/users/me').catch(() => null)
            ]);
            setUsers(usersData);
            setTenants(tenantsData);
            if (meData) setCurrentUserRole(meData.role);
        } catch (err) {
            console.error(err);
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
                await fetchApi(`/users/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                await fetchApi('/users', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }
            setShowForm(false);
            setEditingId(null);
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', email: '', password: '', role: 'visualizacao', phone: '', companyId: '' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'Falha ao salvar usuário');
        }
    };


    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este usuário?')) return;
        try {
            await fetchApi(`/users/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'Falha ao excluir usuário');
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'superadmin': return { label: 'Super Admin', class: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' };
            case 'admin': return { label: 'Administrador', class: 'bg-red-500/10 text-red-600 border-red-200' };
            case 'financeiro': return { label: 'Financeiro', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' };
            default: return { label: 'Visualizador', class: 'bg-blue-500/10 text-blue-600 border-blue-200' };
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Equipe e Usuários</h1>
                    <p className="text-muted-foreground">Gerencie o acesso dos colaboradores à sua empresa.</p>
                </div>
                {(currentUserRole === 'admin' || currentUserRole === 'superadmin') && (
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', email: '', password: '', role: 'visualizacao', phone: '', companyId: '' }); }}
                        className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:ring-4 hover:ring-primary/20 transition-all shadow-lg active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Novo Usuário
                    </button>
                )}
            </header>

            {showForm && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
                            <h2 className="text-xl font-bold">{editingId ? 'Editar Membro' : 'Cadastrar Novo Membro'}</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            {tenants.length > 0 && currentUserRole === 'superadmin' && (
                                <div className="space-y-1.5 p-4 bg-muted/30 rounded-xl border border-dashed border-primary/30">
                                    <label className="text-sm font-bold ml-1 text-primary">Vincular à Empresa (Superadmin)</label>
                                    <select
                                        className="w-full border rounded-xl p-3 bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={(formData as any).companyId || ''}
                                        onChange={e => setFormData({ ...formData, companyId: e.target.value } as any)}
                                        required
                                    >
                                        <option value="">Selecione uma Empresa...</option>
                                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold ml-1">Nome Completo</label>
                                    <input
                                        className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        required placeholder="Ex: João da Silva"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold ml-1">E-mail (Login)</label>
                                    <input
                                        type="email" className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        required placeholder="joao@empresa.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold ml-1">Telefone / WhatsApp</label>
                                        <input
                                            className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                            placeholder="(11) 99999-9999"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold ml-1">Senha</label>
                                        <input
                                            type="password" className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                            placeholder={editingId ? "Deixe em branco para manter" : "******"} minLength={6}
                                            required={!editingId}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold ml-1">Cargo / Permissão</label>
                                        <select
                                            className="w-full border rounded-xl p-3 bg-muted/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="admin">Administrador</option>
                                            <option value="financeiro">Financeiro</option>
                                            <option value="visualizacao">Visualizador</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-semibold hover:bg-muted rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="bg-primary text-primary-foreground px-10 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">Salvar Usuário</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {users.map((u) => {
                        const badge = getRoleBadge(u.role);
                        return (
                            <div key={u.id} className="bg-card p-0 rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                                            <User className="w-7 h-7 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-foreground truncate">{u.name || 'Usuário sem Nome'}</h3>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Shield className="w-3.5 h-3.5" />
                                                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", badge.class)}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 pt-2">
                                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                            <Mail className="w-4 h-4 opacity-50" />
                                            <span className="truncate">{u.email || u.id.substring(0, 18) + '...'}</span>
                                        </div>
                                        {u.phone && (
                                            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                                <Phone className="w-4 h-4 opacity-50" />
                                                <span>{u.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4 opacity-50" />
                                            <span>Membro desde {new Date(u.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-muted/30 px-6 py-3 border-t flex justify-between items-center group-hover:bg-muted/50 transition-colors">
                                    <span className="text-[10px] font-mono text-muted-foreground">ID: {u.id.substring(0, 8)}</span>
                                    {(currentUserRole === 'admin' || currentUserRole === 'superadmin') && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(u)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                                <Edit2 size={12} /> Editar
                                            </button>
                                            <button onClick={() => handleDelete(u.id)} className="text-xs font-bold text-destructive hover:underline flex items-center gap-1">
                                                <Trash2 size={12} /> Excluir
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
