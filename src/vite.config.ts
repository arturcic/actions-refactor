import { resolve } from 'path';
import { defineConfig, loadEnv, UserConfig } from 'vite';

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

export default ({ mode }: Partial<UserConfig>) => {
    console.log(`Building for mode: ${mode}`);

    process.env = { ...process.env, ...loadEnv(mode as string, process.cwd()) };

    return defineConfig({
        build: {
            rollupOptions: rollupOptions,
            target: 'esnext',
            lib: {
                formats: ['es'],
                entry: resolve(__dirname, 'tools/gitversion/main.ts'),
                fileName: `${mode}/gitversion`,
            },
            emptyOutDir: false,
        },
        plugins: [/*dts()*/],
        resolve: {
            alias: {
                '@agents/azure': resolve(__dirname, 'agents/azure'),
                '@agents/github': resolve(__dirname, 'agents/github'),
            }
        },
    });
};

