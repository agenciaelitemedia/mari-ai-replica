import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ModuleStub({
  title,
  description,
  status = "Planejado",
  children,
}: {
  title: string;
  description: string;
  status?: "Planejado" | "Em portabilidade" | "Disponível";
  children?: ReactNode;
}) {
  const statusVariant =
    status === "Disponível" ? "default" : status === "Em portabilidade" ? "secondary" : "outline";
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Badge variant={statusVariant}>{status}</Badge>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
          <CardDescription>
            Este módulo será portado do appjulia em uma fase futura. As tabelas, edge functions
            e integrações específicas serão recriadas como server functions do TanStack Start.
          </CardDescription>
        </CardHeader>
        {children ? <CardContent>{children}</CardContent> : null}
      </Card>
    </div>
  );
}
