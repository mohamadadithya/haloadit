// @ts-check
import { defineConfig, envField } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';
import spotlightjs from '@spotlightjs/astro';
import playformCompress from '@playform/compress';

// https://astro.build/config
export default defineConfig({
  site: 'http://localhost:4321',
  integrations: [svelte(), mdx(), sitemap(), sentry(), spotlightjs(), playformCompress()],
  vite: {
    plugins: [tailwindcss()]
  },
  adapter: vercel(),
  env: {
    schema: {
      SITE_NAME: envField.string({ context: 'client', access: 'public' }),
      SITE_DESCRIPTION: envField.string({ context: 'client', access: 'public' }),
    }
  }
});