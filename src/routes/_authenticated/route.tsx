import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Sparkles, Menu, Bell, Search } from "lucide-react";
import { getIcon } from "@/lib/iconMap";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { user, profile, signOut, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { groupedModules, isLoading: isModulesLoading } = useMenuModules();
  const sortedGroups = getSortedGroups(groupedModules);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navContent = (
    <>
      <div className="h-[70px] flex items-center px-6 border-b border-sidebar-border shrink-0">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            Mar<span className="text-primary">I.A.</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {(isAuthLoading || isModulesLoading) && (
          <div className="space-y-3 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                <div className="h-9 w-full bg-muted animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!isAuthLoading && !isModulesLoading && sortedGroups.length === 0 && (
          <div className="px-2 text-sm text-muted-foreground italic">
            Nenhum módulo disponível.
          </div>
        )}

        {sortedGroups.map(([groupName, groupModules]) => (
          <div key={groupName} className="space-y-1.5">
            <h3 className="px-3 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2">
              {groupName}
            </h3>
            <div className="space-y-1">
              {groupModules.map((item) => {
                const active =
                  pathname === item.route ||
                  (item.route && item.route !== "/" && pathname.startsWith(item.route));
                const IconComponent = getIcon(item.icon);

                return (
                  <Link
                    key={item.id}
                    to={item.route || "/"}
                    className={cn(
                      "group flex items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          active ? "text-primary-foreground" : "text-current",
                        )}
                      />
                    )}
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full hover:bg-muted/50 p-1 pr-3 transition-colors">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold leading-tight text-foreground truncate max-w-[140px]">
              {profile?.full_name || user?.email}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {profile?.cod_agent || "Operador"}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{profile?.full_name || "Usuário"}</span>
            <span className="text-xs text-muted-foreground font-normal truncate">
              {user?.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen flex bg-background font-sans selection:bg-primary/10 selection:text-primary">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-[270px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[270px] bg-sidebar border-r border-sidebar-border shadow-xl animate-in slide-in-from-left duration-300 flex flex-col">
            {navContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Topbar */}
        <header className="h-[70px] flex items-center justify-between px-4 md:px-6 border-b border-border bg-card sticky top-0 z-40">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden md:flex items-center flex-1 max-w-md">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar..."
                className="pl-9 h-10 bg-muted/40 border-transparent focus-visible:bg-card"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full" />
            </Button>
            {userMenu}
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
