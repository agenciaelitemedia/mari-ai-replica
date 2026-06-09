import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import * as LucideIcons from "lucide-react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuModules, getSortedGroups } from "@/hooks/useMenuModules";
import { supabase } from "@/integrations/supabase/client";

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

function AuthenticatedLayout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { groupedModules } = useMenuModules();
  const sortedGroups = getSortedGroups(groupedModules);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.full_name || user?.email || "?")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-muted/30 font-sans selection:bg-primary/10 selection:text-primary">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col border-r bg-card/50 backdrop-blur-xl sticky top-0 h-screen">
        <div className="h-20 flex items-center px-8 border-b border-border/50">
          <Link to="/dashboard" className="flex items-center gap-2 group transition-all duration-300">
            <div className="h-10 w-10 bg-linear-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <LucideIcons.Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
              Mar<span className="text-primary">I.A</span>
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-8 py-6">
          {sortedGroups.map(([groupName, groupModules]) => (
            <div key={groupName} className="space-y-2">
              <h3 className="px-4 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">
                {groupName}
              </h3>
              <div className="space-y-1">
                {groupModules.map((item) => {
                  const active = pathname === item.route || (item.route && item.route !== '/' && pathname.startsWith(item.route));
                  const IconComponent = (LucideIcons as any)[item.icon || 'Circle'];
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.route || '/'}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 relative",
                        active
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:translate-x-1",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
                      )}
                      {IconComponent && (
                        <IconComponent className={cn(
                          "h-5 w-5 transition-colors",
                          active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                        )} />
                      )}
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50 bg-accent/20">
          <div className="bg-card/40 rounded-2xl p-4 flex items-center gap-4 border border-border/40 shadow-sm backdrop-blur-md">
            <Avatar className="h-10 w-10 border-2 border-primary/10 ring-2 ring-background ring-offset-2">
              <AvatarFallback className="bg-linear-to-br from-primary/10 to-primary/5 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{profile?.full_name || user?.email}</p>
              <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">{profile?.cod_agent || "OPERADOR"}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut} 
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-6 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <LucideIcons.Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              Mar<span className="text-primary">I.A</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="text-[10px] font-bold">{initials}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
