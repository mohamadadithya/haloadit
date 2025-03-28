import { glob } from "astro/loaders";
import { z, defineCollection, reference } from "astro:content";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()),
    coverImage: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    relatedPosts: z.array(reference("posts")),
    slug: z.string().optional(),
  }),
});

export const collections = { posts };
