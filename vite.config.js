import { fileURLToPath } from 'node:url';

const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env;

export default {
    root: 'src/',
    publicDir: '../static/',
    base: './',
    server:
    {
        host: true,
        open: !isCodeSandbox // Open if it's not a CodeSandbox
    },
    build:
    {
        outDir: '../docs',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                home: fileURLToPath(new URL('./src/index.html', import.meta.url)),
                mathematics: fileURLToPath(new URL('./src/mathematics/index.html', import.meta.url)),
                software: fileURLToPath(new URL('./src/software/index.html', import.meta.url))
            }
        },
        target: 'esnext' // The optional globe module uses top-level await.
    }
};
