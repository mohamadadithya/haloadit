import siteConfig from "@site-config";
import type { AstroConfig } from "astro";

export async function GET({ site }: AstroConfig) {
  const text = `User-agent: *
Allow: /
Sitemap: ${site || siteConfig.origin}sitemap.xml`;

  return new Response(text, {
    headers: { "Content-Type": "text/plain" },
  });
}
