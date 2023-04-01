import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import cesium from "vite-plugin-cesium";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [react(), cesium()],
});