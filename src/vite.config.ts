import { resolve } from 'path';
import { defineConfig } from 'vite';

// import dts from 'vite-plugin-dts';
// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
    build: {
        rollupOptions: {
            external: [
                "node:util",
                "node:buffer",
                "node:stream",
                "node:net",
                "node:url",
                "node:fs",
                "node:path",
                "perf_hooks",
            ],
            output: {
                globals: {
                    "node:stream": "stream",
                    "node:buffer": "buffer",
                    "node:util": "util",
                    "node:net": "net",
                    "node:url": "url",
                    perf_hooks: "perf_hooks",
                },
                // inlineDynamicImports: true,
            },
        },
        target: 'esnext',
        lib: {
            formats: ['es'],
            entry: resolve(__dirname, 'tools/gitversion/main.ts'),
            name: 'gitversion',
            fileName: 'gitversion',
        },
    },
    plugins: [/*dts()*/],
    resolve: {
        alias: {
            '@agents/azure': resolve(__dirname, 'agents/azure'),
            '@agents/github': resolve(__dirname, 'agents/github'),
        }
    },
});