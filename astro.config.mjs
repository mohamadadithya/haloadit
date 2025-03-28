// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

import sentry from '@sentry/astro';
import spotlightjs from '@spotlightjs/astro';

// https://astro.build/config
export default defineConfig({
  integrations: [
    svelte(),
    mdx(),
    sitemap(),
    sentry(),
    spotlightjs()
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel()
});