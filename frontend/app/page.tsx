'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, TrendingUp, Zap, PieChart, Users, FileText, Loader2, Building2, Wallet } from 'lucide-react';
import { fetchPublicApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        // Using relative path if applicable or environmental variable
        const data = await fetchPublicApi('/plans');
        setPlans(data);
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans selection:bg-primary/20">
      {/* Navbar */}
      <header className="px-6 lg:px-10 py-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-50 bg-background/80 border-b">
        <div className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
          <Wallet className="w-6 h-6 fill-primary/20" />
          <span>ContaCerta</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Planos</a>
          <a href="#testimonials" className="hover:text-primary transition-colors">Depoimentos</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Entrar
          </Link>
          <Link href="/login" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40">
            Começar Agora
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 px-6 text-center max-w-5xl mx-auto overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>

          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-full text-xs font-semibold mb-8 animate-fade-in-up">
            <Zap className="w-3 h-3" />
            <span>Novo: Automação Financeira disponível</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent leading-[1.1]">
            Sua gestão financeira <br className="hidden md:block" /> em um só lugar.
          </h1>

          <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Controle contas a pagar, fornecedores e unidades com a simplicidade que seu negócio merece.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login" className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl text-lg font-bold hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 hover:scale-105 transform duration-200">
              Acessar Sistema
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold px-6 py-4 rounded-xl hover:bg-muted transition-colors">
              Ver Funcionalidades
            </a>
          </div>

          <div className="mt-20 relative rounded-[2rem] border-8 border-background shadow-2xl overflow-hidden aspect-video max-w-4xl mx-auto bg-muted/20">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <PieChart className="w-16 h-16 text-primary opacity-20 mx-auto" />
                <p className="text-muted-foreground font-medium">Dashboard Inteligente</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-6 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl lg:text-5xl font-black">Poderoso. Simples. Seguro.</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Desenvolvido para empresas que buscam eficiência máxima no controle de contas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Gestão de Payables', desc: 'Controle total de contas a pagar com datas e status claros.', icon: FileText },
                { title: 'Gestão de Unidades', desc: 'Separe seus custos por filial, unidade ou centro de custo.', icon: Building2 },
                { title: 'Base de Fornecedores', desc: 'Cadastro centralizado com histórico e dados de contato.', icon: Users },
                { title: 'Relatórios BI', desc: 'Gráficos interativos para análise de categorias e fornecedores.', icon: TrendingUp },
                { title: 'Multitenancy', desc: 'Segurança absoluta: seus dados nunca se misturam.', icon: Shield },
                { title: 'Acesso por Níveis', desc: 'Crie usuários com permissões específicas para seu time.', icon: Zap },
              ].map((f, i) => (
                <div key={i} className="group bg-card p-10 rounded-[2.5rem] border shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-transparent hover:border-primary/20">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl lg:text-5xl font-black">Planos e Preços</h2>
              <p className="text-xl text-muted-foreground">Escolha a melhor opção para o seu momento.</p>
            </div>

            {loadingPlans ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 items-start">
                {plans.map((plan) => (
                  <div key={plan.id} className={cn(
                    "p-10 rounded-[2.5rem] border-2 bg-card flex flex-col relative group transition-all duration-500 hover:shadow-2xl",
                    plan.price > 100 ? "border-primary shadow-xl scale-105" : "border-transparent shadow-sm hover:border-primary/30"
                  )}>
                    {plan.price > 100 && (
                      <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                        Recomendado
                      </div>
                    )}
                    <div className="mb-10">
                      <h3 className="text-2xl font-black mb-4">{plan.name}</h3>
                      <p className="text-muted-foreground font-medium mb-8 min-h-[50px]">{plan.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black tracking-tighter">R$ {plan.price}</span>
                        <span className="text-muted-foreground font-bold text-lg">/mês</span>
                      </div>
                    </div>

                    <div className="space-y-4 flex-1 mb-10">
                      {plan.features?.map((feat: string, i: number) => (
                        <div key={i} className="flex gap-4 text-sm font-bold">
                          <div className="mt-0.5 p-1 bg-emerald-500/10 rounded-full text-emerald-600">
                            <CheckCircle size={16} />
                          </div>
                          <span className="text-foreground/80">{feat}</span>
                        </div>
                      ))}
                    </div>

                    <Link href="/login" className={cn(
                      "block w-full py-5 rounded-2xl font-black text-center transition-all shadow-lg active:scale-95",
                      plan.price > 100
                        ? "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/25"
                        : "bg-muted text-foreground hover:bg-primary hover:text-white"
                    )}>
                      Assinar {plan.name}
                    </Link>
                  </div>
                ))}

                {plans.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-muted/30 rounded-[2rem] border-2 border-dashed">
                    <p className="text-muted-foreground font-bold">Nenhum plano configurado no momento.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-20 px-6 border-t bg-muted/5 mt-auto">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center md:text-left">
          <div className="space-y-4">
            <div className="font-black text-2xl text-primary flex items-center gap-2 justify-center md:justify-start">
              <Wallet className="w-8 h-8" /> ContaCerta
            </div>
            <p className="text-muted-foreground text-sm font-medium">A gestão financeira mais intuitiva do mercado brasileiro.</p>
          </div>
          <div className="flex flex-col gap-3 items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Legal</span>
            <div className="flex gap-6 text-sm font-bold">
              <a href="#" className="hover:text-primary transition-colors">Termos</a>
              <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            </div>
          </div>
          <div className="text-sm font-bold text-muted-foreground">
            &copy; 2026 ContaCerta SaaS. <br /> Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
