import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/ModuleStub";

export const Route = createFileRoute("/_authenticated/comercial")({
  head: () => ({ meta: [{ title: "Comercial — MarI.A" }] }),
  component: () => (
    <ModuleStub title="Comercial" description="Funil comercial, vendedores e metas." />
  ),
});
