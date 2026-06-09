import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — MarI.A" },
      { name: "description", content: "Acesse sua conta MarI.A." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Verifique seu e-mail se a confirmação estiver ativa.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-muted/50 via-background to-muted/50 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4 group transition-transform duration-300 hover:scale-105">
            <div className="h-12 w-12 bg-linear-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <span className="text-2xl font-bold text-primary-foreground">M</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
              Mar<span className="text-primary">I.A</span>
            </h1>
          </Link>
          <p className="text-muted-foreground font-medium">
            Inteligência e automação em um só lugar.
          </p>
        </div>
        <Card className="border-border/40 shadow-2xl shadow-primary/5 backdrop-blur-xl bg-card/80 rounded-3xl overflow-hidden">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader className="p-1 border-b border-border/40">
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-14 p-1">
                <TabsTrigger 
                  value="signin" 
                  className="rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-bold tracking-tight transition-all"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-bold tracking-tight transition-all"
                >
                  Criar conta
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="signin" className="space-y-4 mt-0">
                <CardTitle className="text-lg">Acesse sua conta</CardTitle>
                <CardDescription>Use seu e-mail e senha cadastrados.</CardDescription>
                <form onSubmit={handleSignIn} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="email-in">E-mail</Label>
                    <Input id="email-in" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pwd-in">Senha</Label>
                    <Input id="pwd-in" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="space-y-4 mt-0">
                <CardTitle className="text-lg">Criar conta</CardTitle>
                <CardDescription>Comece agora — leva menos de um minuto.</CardDescription>
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="name-up">Nome completo</Label>
                    <Input id="name-up" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email-up">E-mail</Label>
                    <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pwd-up">Senha</Label>
                    <Input id="pwd-up" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
