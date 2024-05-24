import { resolve } from "path"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "signal-api",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["firebase", /^@firebase\/.+/],
    },
  },
  plugins: [dts({ rollupTypes: true })],
})