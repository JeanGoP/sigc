// vite.config.ts
import { defineConfig, loadEnv } from "file:///D:/Proyectos_Sintesis/MONTELIBANO-SYSTEMA/sigc%20produccion/node_modules/.pnpm/vite@5.2.11_@types+node@20.12.12_sass@1.77.2_terser@5.49.0/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Proyectos_Sintesis/MONTELIBANO-SYSTEMA/sigc%20produccion/node_modules/.pnpm/@vitejs+plugin-react@4.3.0__e29d1e1b86fea2b50db4c2a387577219/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import "file:///D:/Proyectos_Sintesis/MONTELIBANO-SYSTEMA/sigc%20produccion/node_modules/.pnpm/dotenv@16.4.5/node_modules/dotenv/config.js";
var __vite_injected_original_dirname = "D:\\Proyectos_Sintesis\\MONTELIBANO-SYSTEMA\\sigc produccion";
var vite_config_default = ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const { VITE_NODE_ENV } = process.env;
  return defineConfig({
    mode: VITE_NODE_ENV,
    plugins: [react()],
    base: "/",
    // server: {
    //   port: 4000,
    //   strictPort: true, // opcional: falla si el puerto está ocupado
    // },
    resolve: {
      alias: {
        "@app": path.resolve(__vite_injected_original_dirname, "./src"),
        "@store": path.resolve(__vite_injected_original_dirname, "./src/store"),
        "@components": path.resolve(__vite_injected_original_dirname, "./src/components"),
        "@modules": path.resolve(__vite_injected_original_dirname, "./src/modules"),
        "@pages": path.resolve(__vite_injected_original_dirname, "./src/pages")
      }
    }
  });
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQcm95ZWN0b3NfU2ludGVzaXNcXFxcTU9OVEVMSUJBTk8tU1lTVEVNQVxcXFxzaWdjIHByb2R1Y2Npb25cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFByb3llY3Rvc19TaW50ZXNpc1xcXFxNT05URUxJQkFOTy1TWVNURU1BXFxcXHNpZ2MgcHJvZHVjY2lvblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovUHJveWVjdG9zX1NpbnRlc2lzL01PTlRFTElCQU5PLVNZU1RFTUEvc2lnYyUyMHByb2R1Y2Npb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBcImRvdGVudi9jb25maWdcIjtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1hbm9ueW1vdXMtZGVmYXVsdC1leHBvcnRcbmV4cG9ydCBkZWZhdWx0ICh7IG1vZGUgfSkgPT4ge1xuICBwcm9jZXNzLmVudiA9IHsgLi4ucHJvY2Vzcy5lbnYsIC4uLmxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSkgfTtcblxuICBjb25zdCB7IFZJVEVfTk9ERV9FTlYgfSA9IHByb2Nlc3MuZW52O1xuXG4gIHJldHVybiBkZWZpbmVDb25maWcoe1xuICAgIG1vZGU6IFZJVEVfTk9ERV9FTlYsXG4gICAgcGx1Z2luczogW3JlYWN0KCldLFxuICAgIGJhc2U6ICcvJyxcbiAgICAvLyBzZXJ2ZXI6IHtcbiAgICAvLyAgIHBvcnQ6IDQwMDAsXG4gICAgLy8gICBzdHJpY3RQb3J0OiB0cnVlLCAvLyBvcGNpb25hbDogZmFsbGEgc2kgZWwgcHVlcnRvIGVzdFx1MDBFMSBvY3VwYWRvXG4gICAgLy8gfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBhcHBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgICAgXCJAc3RvcmVcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9zdG9yZVwiKSxcbiAgICAgICAgXCJAY29tcG9uZW50c1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL2NvbXBvbmVudHNcIiksXG4gICAgICAgIFwiQG1vZHVsZXNcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9tb2R1bGVzXCIpLFxuICAgICAgICBcIkBwYWdlc1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL3BhZ2VzXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVXLFNBQVMsY0FBYyxlQUFlO0FBQzdZLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsT0FBTztBQUhQLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUMzQixVQUFRLE1BQU0sRUFBRSxHQUFHLFFBQVEsS0FBSyxHQUFHLFFBQVEsTUFBTSxRQUFRLElBQUksQ0FBQyxFQUFFO0FBRWhFLFFBQU0sRUFBRSxjQUFjLElBQUksUUFBUTtBQUVsQyxTQUFPLGFBQWE7QUFBQSxJQUNsQixNQUFNO0FBQUEsSUFDTixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsSUFDakIsTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLTixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxRQUFRLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsUUFDdkMsVUFBVSxLQUFLLFFBQVEsa0NBQVcsYUFBYTtBQUFBLFFBQy9DLGVBQWUsS0FBSyxRQUFRLGtDQUFXLGtCQUFrQjtBQUFBLFFBQ3pELFlBQVksS0FBSyxRQUFRLGtDQUFXLGVBQWU7QUFBQSxRQUNuRCxVQUFVLEtBQUssUUFBUSxrQ0FBVyxhQUFhO0FBQUEsTUFDakQ7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBQ0g7IiwKICAibmFtZXMiOiBbXQp9Cg==
