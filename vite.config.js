import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // OVAJ DEO JE VAŽAN za prosleđivanje API poziva
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Pretpostavka da je vaš backend na portu 3000
        changeOrigin: true,
      },
    },
  },
});
