import { createFileRoute } from "@tanstack/react-router";
import { PlatformContentPage } from "@/components/platform-content-page";

export const Route = createFileRoute("/contact")({
  component: () => <PlatformContentPage contentKey="contact_page" eyebrow="Contact" />,
});
