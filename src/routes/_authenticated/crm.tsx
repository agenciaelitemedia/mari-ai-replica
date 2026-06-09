import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/ModuleStub";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({ meta: [{ title: "CRM — MarI.A" }] }),
  component: () => (
    <ModuleStub
      title="CRM"
      description="Quadros, pipelines, negócios, automações e CRM builder."
      status="Em portabilidade"
    />
  ),
});
