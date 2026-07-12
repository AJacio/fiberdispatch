import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set this to your GitHub repo name so assets resolve correctly on
// https://YOUR-USERNAME.github.io/REPO-NAME/
// If you rename the repo, update this to match.
export default defineConfig({
  base: "/fiberdispatch/",
  plugins: [react()],
});
