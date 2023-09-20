import { resolve } from 'path'
import { builtinModules } from 'node:module'
import { defineConfig, loadEnv, UserConfig } from 'vite'
import { RollupOptions } from 'rollup'
import tsconfigPaths from 'vite-tsconfig-paths'

const rollupOptions: RollupOptions = {
    external: [...builtinModules, ...builtinModules.map(module => `node:${module}`)],
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
        root: resolve(dirname, '..'),
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
                            return `@agents/azure`
                        } else if (id.includes('node_modules/@actions')) {
                            return `@agents/github`
                        } else if (id.includes('node_modules')) {
                            return `vendor`
                        } else if (id.includes('agents/')) {
                            return `${agent}/agent-adapter`
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
                    ...tools,
                    [`@agents/${agent}`]: resolve(dirname, `agents/${agent}/index.ts`)
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
