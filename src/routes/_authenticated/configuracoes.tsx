import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/ModuleStub";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — MarI.A" }] }),
  component: () => (
    <ModuleStub title="Configurações" description="Provedores, integrações e preferências." />
  ),
});
