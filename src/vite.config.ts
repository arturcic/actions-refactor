import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';

// import dts from 'vite-plugin-dts';
// https://vitejs.dev/guide/build.html#library-mode

const rollupOptions = {
    external: [
        'console',
        'node:util',
        'node:buffer',
        'node:stream',
        'node:net',
        'node:url',
        'node:fs',
        'node:path',
        'perf_hooks',
    ],
    output: {
        globals: {
            'node:stream': 'stream',
            'node:buffer': 'buffer',
            'node:util': 'util',
            'node:net': 'net',
            'node:url': 'url',
            perf_hooks: 'perf_hooks',
        },
        // inlineDynamicImports: true,
    },
};

export default (mode: string, tool: 'gitversion' | 'gitreleasemanager') => {
    console.log(`Building for mode: ${mode}, for tool: ${tool}`);

    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

    return defineConfig({
        build: {
            rollupOptions: rollupOptions,
            target: 'esnext',
            lib: {
                formats: ['es'],
                entry: resolve(__dirname, `tools/${tool}/main.ts`),
                fileName: `${mode}/${tool}`,
            },
            emptyOutDir: false,
        },
        plugins: [/*dts()*/],
        resolve: {
            alias: {
                '@agents/common': resolve(__dirname, 'agents/common'),
                '@agents/azure': resolve(__dirname, 'agents/azure'),
                '@agents/github': resolve(__dirname, 'agents/github'),
            }
        },
    });
};

