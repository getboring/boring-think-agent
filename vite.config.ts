import agents from "agents/vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [agents(), react(), cloudflare(), tailwindcss()],
  resolve: {
    alias: {
      turndown: "./src/turndown-stub.ts",
    },
  },
});
