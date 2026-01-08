'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Wallet } from 'lucide-react';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
            <div className="w-full max-w-md bg-card p-8 rounded-2xl border shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>

                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl mb-4 text-primary">
                        <Wallet className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-center">ContaCerta</h2>
                    <p className="text-center text-muted-foreground text-sm">Finanças sob controle.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1.5">E-mail Corporativo</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2.5 focus:ring-2 ring-primary ring-offset-2 outline-none transition-all"
                            placeholder="nome@empresa.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2.5 focus:ring-2 ring-primary ring-offset-2 outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                            <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                            Lembrar de mim
                        </label>
                        <a href="#" className="text-primary hover:underline font-medium">Esqueceu a senha?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="block w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Entrando...' : 'Acessar Painel'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
                    Ainda não é cliente? <Link href="/register" className="text-primary hover:underline font-bold">Comece Grátis</Link>
                </div>
            </div>
        </div>
    )
}
