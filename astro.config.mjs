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
import playformInline from '@playform/inline';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://haloadit.com',
  integrations: [svelte(), mdx(), sitemap(), sentry(), spotlightjs(), playformCompress(), playformInline(), partytown({
    config: {
      forward: ['dataLayer.push', 'gtag']
    }
  }), icon({
    include: {
      mdi: ["*"],
      lucide: ["settings"],
      uil: ["*"],
      bi: ["twitter-x"]
    }
  })],
  vite: {
    plugins: [tailwindcss()]
  },
  adapter: vercel(),
  env: {
    schema: {
      GA_ID: envField.string({ context: 'client', access: 'public' }),
    }
  },
  prefetch: true
});