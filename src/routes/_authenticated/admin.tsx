import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/ModuleStub";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — MarI.A" }] }),
  component: () => (
    <ModuleStub title="Admin" description="Visão administrativa, auditoria e billing." />
  ),
});
