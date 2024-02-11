import { resolve } from 'path'
import { builtinModules } from 'node:module'
import { defineConfig, loadEnv, UserConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const config = ({ mode: agent }: Partial<UserConfig>): UserConfig => {
    console.log(`Building for mode: ${agent}`)

    if (agent != null) {
        process.env = { ...process.env, ...loadEnv(agent, process.cwd()) }
    }

    const dirname = __dirname
    const tools = ['gitversion', 'gitreleasemanager']
        .map(tool => ({
            [`tools/${tool}`]: resolve(dirname, `tools/${tool}/main.ts`)
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
            target: 'esnext',
            lib: {
                formats: ['es'],
                entry: {
                    ...tools,
                    [`agents/${agent}/agent`]: resolve(dirname, `agents/${agent}/index.ts`)
                }
            },
            rollupOptions: {
                external: [...builtinModules, ...builtinModules.map(module => `node:${module}`)],
                output: {
                    chunkFileNames: '[name].js',
                    manualChunks(id: string) {
                        // console.log(`id: ${id}`)
                        if (id.includes('node_modules/semver')) {
                            return `agents/vendor`
                        } else if (id.includes('node_modules')) {
                            return `agents/${agent}/vendor`
                        } else if (id.includes('tools/common')) {
                            return `tools/tools-common`
                        }
                    }
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
