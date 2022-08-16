import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3001,
  },
  build: {
    lib: {
      entry: resolve(__dirname, "lib/index.js"),
      name: "UVList",
      fileName: "uv-list",
    },
    rollupOptions: {
      external: [
        "lit",
        "lit/directives/ref.js",
        "lit/directives/class-map.js",
        "lit/directives/repeat.js",
      ],
      output: {
        globals: {
          lit: "lit",
          "lit/directives/ref.js": "lit/directives/ref.js",
          "lit/directives/repeat.js": "lit/directives/repeat.js",
          "lit/directives/class-map.js": "lit/directives/class-map.js",
        },
      },
    },
  },
});
