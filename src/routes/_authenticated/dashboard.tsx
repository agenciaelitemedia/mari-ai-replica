import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Briefcase, Bot, Contact, Phone, Scale } from "lucide-react";

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
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo à MarI.A</h1>
        <p className="text-muted-foreground mt-1">
          Plataforma de atendimento, CRM e automação. A fundação está pronta — os módulos serão portados em fases.
        </p>
      </header>
      <section>
        <h2 className="text-lg font-semibold mb-3">Acesso rápido</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.to} to={q.to} className="block">
                <Card className="hover:border-primary transition-colors h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base">{q.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{q.desc}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
