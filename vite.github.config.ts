import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const configuredBase = process.env.SITE_BASE_PATH?.trim();
const base = configuredBase || (
  process.env.GITHUB_ACTIONS === "true" && repositoryName
    ? `/${repositoryName}/`
    : "/"
);

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "github-dist",
    emptyOutDir: true,
  },
});
