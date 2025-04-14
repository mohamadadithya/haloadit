import rss from "@astrojs/rss";
import { contentfulClient, type BlogPost } from "@contentful";
import siteConfig from "@site-config";
import type { AstroConfig } from "astro";

export async function GET({ site }: AstroConfig) {
  const entries = await contentfulClient.getEntries<BlogPost>({
    content_type: "blogPost",
  });

  const posts = entries.items.map((item) => {
    const {
      fields: { title, date, description, slug },
      metadata: { tags },
    } = item;

    return {
      title,
      slug,
      description,
      tags,
      date,
    };
  });

  return rss({
    title: `${siteConfig.title} - RSS Feed`,
    description: siteConfig.description,
    site: site || siteConfig.origin,
    trailingSlash: false,
    items: posts.map((post) => ({
      ...post,
      pubDate: new Date(post.date),
      link: `/${post.slug}`,
      customData: `<language>id-ID</language>`,
    })),
    customData: `<language>id-ID</language>`,
    stylesheet: "/styles/rss.xsl",
  });
}
