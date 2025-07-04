import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs/promises';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'CERNMapOverlay',
      fileName: (format) => `cern-map-overlay.${format}.js`,
      formats: ['es', 'iife'],
    },
    minify: true,
  },
  plugins: [
    {
      name: 'copy-demo-html',
      writeBundle: async () => {
        const demoHtmlPath = path.resolve(__dirname, 'index.html');
        const outHtmlPath = path.resolve(__dirname, 'dist/index.html');
        let html = await fs.readFile(demoHtmlPath, 'utf8');
        html = html.replace(
          /<script type="module" src="[^"]+"><\/script>/,
          `<script type="module" src="cern-map-overlay.iife.js"></script>`,
        );
        await fs.writeFile(outHtmlPath, html);
      },
    },
  ],
});
