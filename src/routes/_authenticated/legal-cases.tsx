import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/ModuleStub";

export const Route = createFileRoute("/_authenticated/legal-cases")({
  head: () => ({ meta: [{ title: "Jurídico — MarI.A" }] }),
  component: () => (
    <ModuleStub title="Jurídico" description="Processos (DataJud), contratos (ZapSign) e ADVBox." />
  ),
});
