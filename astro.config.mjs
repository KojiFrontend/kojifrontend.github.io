import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://koji.fyi',
  build: {
    inlineStylesheets: 'auto'
  }
});
