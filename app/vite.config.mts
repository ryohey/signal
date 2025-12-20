import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig, loadEnv } from "vite"
import checker from "vite-plugin-checker"
import svgr from "vite-plugin-svgr"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.join(process.cwd(), ".."), "FIREBASE_")

  return {
    plugins: [
      checker({
        typescript: true,
      }),
      react(),
      svgr({
        include: "**/*.svg",
        svgrOptions: {
          plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
          exportType: "default",
        },
      }),
      {
        name: "rewrite-path",
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url === "/home") {
              req.url = "/community"
            }
            if (req.url === "/profile") {
              req.url = "/community"
            }
            if (req.url?.startsWith("/users/")) {
              req.url = "/community"
            }
            if (req.url?.startsWith("/songs/")) {
              req.url = "/community"
            }
            next()
          })
        },
      },
    ],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "edit.html"),
          auth: path.resolve(__dirname, "auth.html"),
          community: path.resolve(__dirname, "community.html"),
        },
      },
      minify: false,
      sourcemap: true,
    },
    publicDir: "public",
    server: {
      port: 3000,
      open: "/edit",
    },
    resolve: {
      alias: {
        react: path.resolve("../node_modules/react"),
      },
    },
    envDir: "..",
    define: {
      "process.env": env,
    },
    optimizeDeps: {
      include: ["firebase/app", "firebase/firestore"],
    },
  }
})
