import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/ModuleStub";

export const Route = createFileRoute("/_authenticated/contatos")({
  head: () => ({ meta: [{ title: "Contatos — MarI.A" }] }),
  component: () => (
    <ModuleStub title="Contatos" description="Base de leads, clientes e segmentação." />
  ),
});
