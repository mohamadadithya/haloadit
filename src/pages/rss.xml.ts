import rss from "@astrojs/rss";
import siteConfig from "@site-config";
import { getCollection } from "astro:content";

export async function GET({ site }: { site: string }) {
  const posts = await getCollection("posts");

  return rss({
    title: `${siteConfig.name} | RSS Feed`,
    description: siteConfig.description,
    site,
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
