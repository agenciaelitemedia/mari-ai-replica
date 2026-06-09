import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/ModuleStub";

export const Route = createFileRoute("/_authenticated/agentes")({
  head: () => ({ meta: [{ title: "Agentes IA — MarI.A." }] }),
  component: () => (
    <ModuleStub
      title="Agentes IA"
      description="Copilot, prompt-generator, assistentes de chat e classificação automática."
    />
  ),
});
