import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import * as LucideIcons from "lucide-react";
import {
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuModules, getSortedGroups } from "@/hooks/useMenuModules";


export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "Chat / WhatsApp", icon: MessageSquare },
  { to: "/crm", label: "CRM", icon: Briefcase },
  { to: "/contatos", label: "Contatos", icon: Contact },
  { to: "/agentes", label: "Agentes IA", icon: Bot },
  { to: "/comercial", label: "Comercial", icon: Users },
  { to: "/criativos", label: "Criativos", icon: ImageIcon },
  { to: "/legal-cases", label: "Jurídico", icon: Scale },
  { to: "/telefonia", label: "Telefonia", icon: Phone },
  { to: "/equipe", label: "Equipe", icon: UsersRound },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
];

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [profile, setProfile] = useState<{ full_name: string | null; cod_agent: string | null } | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("full_name, cod_agent")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user.id]);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.full_name || user.email || "?")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-muted/20">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card">
        <div className="h-16 flex items-center px-6 border-b">
          <Link to="/dashboard" className="text-2xl font-bold tracking-tight">
            Mar<span className="text-primary">I.A</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {sortedGroups.map(([groupName, groupModules]) => (
            <div key={groupName} className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {groupName}
              </h3>
              {groupModules.map((item) => {
                const active = pathname === item.route || (item.route && item.route !== '/' && pathname.startsWith(item.route));
                const IconComponent = (LucideIcons as any)[item.icon || 'Circle'];
                
                return (
                  <Link
                    key={item.id}
                    to={item.route || '/'}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t p-3 flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name || user.email}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.cod_agent || "—"}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b bg-card">
          <Link to="/dashboard" className="text-xl font-bold">
            Mar<span className="text-primary">I.A</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
