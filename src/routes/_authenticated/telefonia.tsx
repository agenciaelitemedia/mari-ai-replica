import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/ModuleStub";

export const Route = createFileRoute("/_authenticated/telefonia")({
  head: () => ({ meta: [{ title: "Telefonia — MarI.A" }] }),
  component: () => (
    <ModuleStub title="Telefonia" description="Filas, chamadas (3CPlus, api4com, Vellip) e SIP." />
  ),
});
