import { createFileRoute } from "@tanstack/react-router";
import { PlatformContentPage } from "@/components/platform-content-page";

export const Route = createFileRoute("/terms")({
  component: () => <PlatformContentPage contentKey="terms_of_service" eyebrow="Terms" />,
});
