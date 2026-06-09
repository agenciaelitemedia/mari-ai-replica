import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare,
  Briefcase,
  Bot,
  Contact,
  Phone,
  Scale,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MarI.A" }] }),
  component: DashboardPage,
});

const STATS = [
  { label: "Atendimentos", value: "1.284", delta: "+12%", icon: Activity, tone: "bg-primary/10 text-primary" },
  { label: "Clientes", value: "342", delta: "+5%", icon: Users, tone: "bg-secondary/15 text-secondary" },
  { label: "Receita", value: "R$ 48k", delta: "+18%", icon: DollarSign, tone: "bg-emerald-500/10 text-emerald-600" },
  { label: "Conversão", value: "32%", delta: "+3%", icon: TrendingUp, tone: "bg-amber-500/10 text-amber-600" },
] as const;

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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo de volta! Aqui está o que está acontecendo hoje.
        </p>
      </header>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-0">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${s.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold text-foreground">{s.value}</span>
                    <span className="text-[11px] font-semibold text-emerald-600">{s.delta}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold tracking-tight">Módulos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.to} to={q.to} className="group">
                <Card className="h-full transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base font-bold tracking-tight">{q.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {q.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-lg font-bold mb-2">Próximos Passos</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Estamos portando todas as funcionalidades do AppJulia para a nova infraestrutura.
              Fique atento às atualizações automáticas do sistema.
            </p>
            <Button className="h-10">Ver roteiro de atualizações</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 p-5 rounded-xl">
              <p className="text-2xl font-bold text-primary mb-1">98%</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Uptime
              </p>
            </div>
            <div className="bg-secondary/10 p-5 rounded-xl">
              <p className="text-2xl font-bold text-secondary mb-1">0.2s</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Latência
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
