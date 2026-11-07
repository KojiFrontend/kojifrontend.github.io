import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://koji.fyi',
  base: '/',
  build: {
    inlineStylesheets: 'auto'
  }
});
