import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/ModuleStub";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({ meta: [{ title: "Equipe — MarI.A." }] }),
  component: () => (
    <ModuleStub title="Equipe" description="Membros, papéis e permissões." />
  ),
});
