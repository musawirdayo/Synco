import { createFileRoute } from "@tanstack/react-router";
import { JoinForm } from "./join_.$code";

export const Route = createFileRoute("/join")({ component: () => <JoinForm /> });
