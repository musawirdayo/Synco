import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

const supabaseEnvDefines: Record<string, string> = {};
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabasePublishableKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

if (supabaseUrl) {
  supabaseEnvDefines["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(supabaseUrl);
}

if (supabasePublishableKey) {
  supabaseEnvDefines["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"] =
    JSON.stringify(supabasePublishableKey);
}

const isVitest = process.env.VITEST === "true";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    define: supabaseEnvDefines,
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            tanstack: ["@tanstack/react-router", "@tanstack/react-query"],
            supabase: ["@supabase/supabase-js"],
            motion: ["framer-motion"],
            icons: ["lucide-react"],
          },
        },
      },
    },
    plugins: isVitest ? [] : [nitro()],
  },
});
