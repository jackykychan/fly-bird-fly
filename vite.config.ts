import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` must match the GitHub Pages project path in production so built asset
// URLs resolve under /fly-bird-fly/. Dev and preview stay at root.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/fly-bird-fly/" : "/",
  plugins: [react()],
}));
