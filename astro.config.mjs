// @ts-check
import { defineConfig, envField } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';
import spotlightjs from '@spotlightjs/astro';
import playformInline from '@playform/inline';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import { imageService } from '@unpic/astro/service';
import netlify from "@astrojs/netlify/functions";

import zserviceWorker from 'zastro-service-worker';

// https://astro.build/config
export default defineConfig({
  site: 'https://haloadit.com',
  integrations: [svelte(), mdx(), sitemap(), sentry(), spotlightjs(), playformInline(), partytown({
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
  }), zserviceWorker()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // Prevent prebundling server-only libs for the browser graph
      exclude: ['@sentry/node', '@opentelemetry/api', '@opentelemetry/instrumentation'],
    },
    ssr: {
      target: 'node',
      // These libs try to pull Node internals; keep them bundled for SSR
      noExternal: [
        '@sentry/node',
        /^@opentelemetry\//,
      ],
    },
  },
  output: 'server',
  adapter: netlify({}),
  env: {
    schema: {
      GA_ID: envField.string({ context: 'client', access: 'public' }),
    }
  },
  prefetch: true,
  image: {
    remotePatterns: [{ protocol: 'https' }],
    service: imageService({
      placeholder: 'blurhash',
      fallbackService: 'astro'
    })
  },
});