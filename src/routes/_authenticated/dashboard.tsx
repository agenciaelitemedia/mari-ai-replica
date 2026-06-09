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
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="relative flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Bem-vindo de volta! Aqui está o que está acontecendo hoje.
          </p>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Módulos</h2>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.to} to={q.to} className="group">
                <Card className="relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-200 h-full hover:shadow-lg">
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base font-bold tracking-tight">{q.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {q.desc}
                    </CardDescription>
                  </CardContent>
                  <div className="px-6 pb-6 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-full animate-in slide-in-from-left-full duration-500" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-card border border-border/50 rounded-xl p-6 md:p-8">
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-lg font-bold mb-2">Próximos Passos</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Estamos portando todas as funcionalidades do AppJulia para a nova infraestrutura. Fique atento às atualizações automáticas do sistema.
            </p>
            <Button className="rounded-lg px-6 h-10 text-sm font-semibold">
              Ver roteiro de atualizações
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-6 rounded-lg border border-border/50">
              <p className="text-2xl font-bold text-primary mb-1">98%</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Uptime</p>
            </div>
            <div className="bg-muted/30 p-6 rounded-lg border border-border/50">
              <p className="text-2xl font-bold text-primary mb-1">0.2s</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Latência</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
