import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Static SPA. No backend. Served from a GitHub Pages project subpath (/chatrecap/).
export default defineConfig({
  base: "/chatrecap/",
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2021",
  },
  test: {
    globals: true,
    environment: "node",
  },
});
