import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/ModuleStub";

export const Route = createFileRoute("/_authenticated/criativos")({
  head: () => ({ meta: [{ title: "Criativos — MarI.A." }] }),
  component: () => (
    <ModuleStub title="Criativos" description="Biblioteca de criativos e geração com IA." />
  ),
});
