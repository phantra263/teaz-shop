import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { reviewPages } from "./reviewPages";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");
  const siteUrl = (env.VITE_SITE_URL || "https://teaz-shop.store").replace(
    /\/$/,
    "",
  );

  return {
    plugins: [react(), tailwindcss(), reviewPages(siteUrl)],
    define: {
      "import.meta.env.VITE_SITE_URL": JSON.stringify(siteUrl),
    },
    server: {
      port: 5173,
    },
  };
});
