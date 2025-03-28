import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_DESCRIPTION, SITE_NAME } from "astro:env/client";

export async function GET({ site }: { site: string }) {
  const posts = await getCollection("posts");

  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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
  });
}
