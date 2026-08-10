import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    define: {
      'process.env': process.env,
      global: 'globalThis',
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'cross-fetch': path.resolve(__dirname, 'src/cross-fetch-shim.ts'),
      },
    },
    optimizeDeps: {
      include: ['@reown/appkit', '@reown/appkit-adapter-wagmi', '@reown/appkit-siwe', 'wagmi', 'viem'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
