import { resolve } from 'path';
import { defineConfig, loadEnv, UserConfig } from 'vite';
import { RollupOptions } from 'rollup';
import * as console from 'console';

// import dts from 'vite-plugin-dts';
// https://vitejs.dev/guide/build.html#library-mode

const rollupOptions: RollupOptions = {
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

export default ({ mode: agent }: Partial<UserConfig>) => {
    console.log(`Building for mode: ${agent}`);

    process.env = { ...process.env, ...loadEnv(agent!, process.cwd()) };

    const tools =
        ['gitversion', 'gitreleasemanager'].map(tool => ({
            [`${agent}/${tool}`]: resolve(__dirname, `tools/${tool}/main.ts`)
        })).reduce((acc, cur) => ({ ...acc, ...cur }), {});

    return defineConfig({
        build: {
            rollupOptions: {
                ...rollupOptions,
                output: {
                    ...rollupOptions.output,
                    manualChunks(id: string) {
                        console.log(`id: ${id}`);
                        if (id.includes('node_modules')) {
                            return 'vendor';
                        }
                        if (id.includes('agents/')) {
                            return `${agent}/agent`;
                        }
                    }
                }
            },
            target: 'esnext',
            lib: {
                formats: ['es'],
                entry: {
                    ...tools
                }
            },
            emptyOutDir: false,
            // sourcemap: true,
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

