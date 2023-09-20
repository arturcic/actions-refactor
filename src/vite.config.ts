import { resolve } from 'path'
import { defineConfig, loadEnv, UserConfig } from 'vite'
import { RollupOptions } from 'rollup'
import tsconfigPaths from 'vite-tsconfig-paths'

const rollupOptions: RollupOptions = {
    external: [
        'console',
        'os',
        'fs',
        'path',
        'process',
        'child_process',
        'util',
        'crypto',
        'buffer',
        'stream',
        'net',
        'http',
        'https',
        'url',
        'events',
        'perf_hooks',
        'zlib',
        'assert',
        'timers',
        'tls'
    ],
    output: {
        globals: {
            'node:stream': 'stream',
            'node:buffer': 'buffer',
            'node:util': 'util',
            'node:net': 'net',
            'node:url': 'url',
            'node:os': 'os',
            perf_hooks: 'perf_hooks'
        }
        // inlineDynamicImports: true,
    }
}

const config = ({ mode: agent }: Partial<UserConfig>): UserConfig => {
    console.log(`Building for mode: ${agent}`)

    if (agent != null) {
        process.env = { ...process.env, ...loadEnv(agent, process.cwd()) }
    }

    const dirname = __dirname
    const tools = ['gitversion', 'gitreleasemanager']
        .map(tool => ({
            [`${agent}/${tool}`]: resolve(dirname, `tools/${tool}/main.ts`)
        }))
        .reduce((acc, cur) => ({ ...acc, ...cur }), {})

    return defineConfig({
        plugins: [
            tsconfigPaths({
                root: '..'
            })
        ],
        build: {
            rollupOptions: {
                ...rollupOptions,
                output: {
                    ...rollupOptions.output,
                    chunkFileNames: '[name].js',
                    manualChunks(id: string) {
                        // console.log(`id: ${id}`);
                        if (id.includes('node_modules/azure-pipelines')) {
                            return `azure/bundle`
                        } else if (id.includes('node_modules/@actions')) {
                            return `github/bundle`
                        } else if (id.includes('node_modules')) {
                            return `vendor`
                        } else if (id.includes('agents/')) {
                            return `${agent}/agent-wrapper`
                        } else if (id.includes('tools/common')) {
                            return `tools`
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
            minify: false
        },
        test: {
            globals: true,
            include: ['**/*.test.ts']
        }
    } as UserConfig)
}
export default config
