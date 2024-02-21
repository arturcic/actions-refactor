import { defineConfig, UserConfig } from 'vite'
import { resolve } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { builtinModules } from 'node:module'

export function viteConfig(entry: { [p: string]: string }, manualChunks: (id: string) => string | undefined): UserConfig {
    return defineConfig({
        root: resolve(__dirname, '..'),
        esbuild: {
            target: 'node20'
        },
        plugins: [
            tsconfigPaths({
                root: '..'
            })
        ],
        build: {
            target: 'esnext',
            lib: {
                formats: ['es'],
                entry
            },
            rollupOptions: {
                external: [...builtinModules, ...builtinModules.map(module => `node:${module}`)],
                output: {
                    chunkFileNames: '[name].js',
                    manualChunks
                }
            },
            emptyOutDir: false,
            sourcemap: true,
            minify: false
        }
    } as UserConfig)
}
