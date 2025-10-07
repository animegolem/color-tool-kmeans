// electron.vite.config.ts
import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
var __electron_vite_injected_dirname = "/var/home/golem/git/color-tool-kmeans/electron-app";
var rootDir = resolve(__electron_vite_injected_dirname);
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: resolve(rootDir, "dist/main"),
      rollupOptions: {
        input: resolve(rootDir, "src/main/index.ts")
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: resolve(rootDir, "dist/preload"),
      rollupOptions: {
        input: resolve(rootDir, "src/preload/index.ts")
      }
    }
  },
  renderer: {
    root: resolve(rootDir, "src/renderer"),
    build: {
      outDir: resolve(rootDir, "dist/renderer")
    },
    resolve: {
      alias: {
        "@renderer": resolve(rootDir, "src/renderer")
      }
    },
    server: {
      port: 5175,
      strictPort: true,
      fs: {
        allow: [resolve(rootDir, ".."), rootDir]
      }
    },
    plugins: [
      svelte({
        compilerOptions: {
          runes: true,
          compatibility: {
            componentApi: 4
          }
        }
      })
    ]
  }
});
export {
  electron_vite_config_default as default
};
