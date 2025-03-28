import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_NAME } from "astro:env/client";

export async function GET({ site }: { site: string }) {
  const posts = await getCollection("posts");

  return rss({
    title: SITE_NAME,
    description:
      "Tempat saya berbagi catatan, pengalaman, dan proyek yang saya kerjakan sebagai frontend developer. Mulai dari eksplorasi teknologi, tips pengembangan web, hingga portofolio karya saya—semuanya ada di sini!",
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
