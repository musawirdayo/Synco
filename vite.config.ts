import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

const supabaseUrlEnvKeys = [
  "VITE_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "PUBLIC_SUPABASE_URL",
] as const;

const supabaseKeyEnvKeys = [
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "PUBLIC_SUPABASE_ANON_KEY",
] as const;

function firstEnv(keys: readonly string[]) {
  return keys.map((key) => process.env[key]).find(Boolean);
}

const supabaseEnvDefines: Record<string, string> = {};
const supabaseUrl = firstEnv(supabaseUrlEnvKeys);
const supabasePublishableKey = firstEnv(supabaseKeyEnvKeys);

if (supabaseUrl) {
  supabaseEnvDefines["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(supabaseUrl);
}

if (supabasePublishableKey) {
  supabaseEnvDefines["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"] =
    JSON.stringify(supabasePublishableKey);
}

const isVitest = process.env.VITEST === "true";

function manualChunks(id: string) {
  if (!id.includes("node_modules")) return;
  if (id.includes("@tanstack/react-router") || id.includes("@tanstack/react-query")) {
    return "tanstack";
  }
  if (id.includes("@supabase/supabase-js")) return "supabase";
  if (id.includes("framer-motion")) return "motion";
  if (id.includes("lucide-react")) return "icons";
}

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    define: supabaseEnvDefines,
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
    plugins: isVitest ? [] : [nitro()],
  },
});
