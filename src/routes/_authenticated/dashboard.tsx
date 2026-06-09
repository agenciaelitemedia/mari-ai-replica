import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Briefcase, Bot, Contact, Phone, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MarI.A" }] }),
  component: DashboardPage,
});

const QUICK = [
  { to: "/chat", label: "Chat / WhatsApp", desc: "Atendimento em tempo real", icon: MessageSquare },
  { to: "/crm", label: "CRM", desc: "Funil de vendas e negócios", icon: Briefcase },
  { to: "/agentes", label: "Agentes IA", desc: "Automações com inteligência artificial", icon: Bot },
  { to: "/contatos", label: "Contatos", desc: "Base de leads e clientes", icon: Contact },
  { to: "/telefonia", label: "Telefonia", desc: "Filas e chamadas", icon: Phone },
  { to: "/legal-cases", label: "Jurídico", desc: "Processos e contratos", icon: Scale },
] as const;

function DashboardPage() {
  return (
    <div className="p-6 md:p-12 space-y-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="relative">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl mb-4">
          Bem-vindo à <span className="text-gradient">MarI.A</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Sua central inteligente de atendimento e gestão. Uma experiência premium projetada para máxima produtividade.
        </p>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Módulos principais</h2>
          <div className="h-px flex-1 bg-border/50 mx-6 hidden md:block" />
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK.map((q, idx) => {
            const Icon = q.icon;
            return (
              <Link key={q.to} to={q.to} className="group">
                <Card className="relative overflow-hidden border-border/40 hover:border-primary/50 transition-all duration-300 h-full hover:shadow-2xl hover:shadow-primary/5 group-hover:-translate-y-1">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
                  </div>
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl font-bold tracking-tight">{q.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-base leading-relaxed text-muted-foreground/80">
                      {q.desc}
                    </CardDescription>
                  </CardContent>
                  <div className="px-6 pb-6 mt-auto">
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/20 group-hover:bg-primary transition-all duration-500 rounded-full" 
                        style={{ width: '0%', transitionDelay: `${idx * 100}ms` }}
                        ref={(el) => { if(el) setTimeout(() => el.style.width = '30%', 100); }}
                      />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-primary/5 border border-primary/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -mr-48 -mt-48 opacity-50" />
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">Próximos Passos</h3>
            <p className="text-muted-foreground mb-6 text-lg">
              Estamos portando todas as funcionalidades do AppJulia para a nova infraestrutura. Fique atento às atualizações automáticas do sistema.
            </p>
            <Button className="rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-primary/20">
              Ver roteiro de atualizações
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/40">
              <p className="text-3xl font-bold text-primary mb-1">98%</p>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Uptime</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/40">
              <p className="text-3xl font-bold text-primary mb-1">0.2s</p>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Latência</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
