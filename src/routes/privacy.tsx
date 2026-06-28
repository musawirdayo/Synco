import { createFileRoute } from "@tanstack/react-router";
import { PlatformContentPage } from "@/components/platform-content-page";

export const Route = createFileRoute("/privacy")({
  component: () => <PlatformContentPage contentKey="privacy_policy" eyebrow="Privacy" />,
});
