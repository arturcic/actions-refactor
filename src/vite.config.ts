import { resolve } from 'path';
import { defineConfig } from 'vite';

// import dts from 'vite-plugin-dts';
// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
    build: {
        rollupOptions: {
            logLevel: 'debug',
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
});