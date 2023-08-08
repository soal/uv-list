import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  server: {
    port: 3001,
  },
  build: {
    lib: {
      entry: resolve(__dirname, "lib/index.js"),
      name: "UvList",
      fileName: "uv-list",
    },
    sourcemap: true,
    rollupOptions: {
      plugins: [],
      external: mode === "production" ? [] : [
        "lit",
        "lit/directives/ref.js",
        "lit/directives/class-map.js",
        "lit/directives/style-map.js",
        "lit/directives/repeat.js",
      ],
      output: {
        globals: {
          lit: "lit",
          "lit/directives/ref.js": "lit/directives/ref.js",
          "lit/directives/repeat.js": "lit/directives/repeat.js",
          "lit/directives/class-map.js": "lit/directives/class-map.js",
          "lit/directives/style-map.js": "lit/directives/style-map.js",
        },
      },
    },
  },
}));
