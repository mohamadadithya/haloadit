import rss from "@astrojs/rss";
import siteConfig from "@site-config";
import type { AstroConfig } from "astro";
import { getCollection } from "astro:content";

export async function GET({ site }: AstroConfig) {
  const posts = await getCollection("posts");

  return rss({
    title: `${siteConfig.name} | RSS Feed`,
    description: siteConfig.description,
    site: site || siteConfig.origin,
    trailingSlash: false,
    items: posts.map((post) => {
      const { data } = post;

      return {
        ...data,
        link: `/posts/${data.slug || post.id}`,
        customData: `<language>id-ID</language>`,
      };
    }),
    customData: `<language>id-ID</language>`,
    stylesheet: "/styles/rss.xsl",
  });
}
