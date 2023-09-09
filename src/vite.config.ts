import { resolve } from 'path';
import { defineConfig, loadEnv, UserConfig } from 'vite';
import { RollupOptions } from 'rollup';

const rollupOptions: RollupOptions = {
    external: [
        'console',
        'node:process',
        'node:child_process',
        'node:os',
        'node:util',
        'node:crypto',
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

    const dirname = __dirname;
    const tools =
        ['gitversion', 'gitreleasemanager'].map(tool => ({
            [`${agent}/${tool}`]: resolve(dirname, `tools/${tool}/main.ts`)
        })).reduce((acc, cur) => ({ ...acc, ...cur }), {});

    return defineConfig({
        resolve: {
            alias: {
                '@agents/common': resolve(dirname, 'agents/common'),
                '@agents/fake': resolve(dirname, 'agents/fake'),
                '@agents/azure': resolve(dirname, 'agents/azure'),
                '@agents/github': resolve(dirname, 'agents/github'),

                '@tools/common': resolve(dirname, 'tools/common'),
            }
        },
        build: {
            rollupOptions: {
                ...rollupOptions,
                output: {
                    ...rollupOptions.output,
                    manualChunks(id: string) {
                        // console.log(`id: ${id}`);
                        if (id.includes('node_modules')) {
                            return `${agent}/vendor`;
                        }
                        if (id.includes('agents/')) {
                            return `${agent}/agent`;
                        }
                        if (id.includes('tools/common')) {
                            return `tools`;
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
            sourcemap: true,
            // minify: 'esbuild',
        },
        test: {
            globals: true,
            include: ['**/*.test.ts'],
        }
    } as UserConfig);
};

