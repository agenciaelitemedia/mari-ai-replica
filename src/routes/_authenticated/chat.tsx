import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/ModuleStub";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat — MarI.A" }] }),
  component: () => (
    <ModuleStub
      title="Chat / WhatsApp"
      description="Atendimento omnichannel — WhatsApp (uazapi, WABA), Instagram, webchat."
      status="Em portabilidade"
    />
  ),
});
