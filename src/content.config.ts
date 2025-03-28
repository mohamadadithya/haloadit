import { glob } from "astro/loaders";
import { z, defineCollection, reference } from "astro:content";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    coverImage: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    relatedPosts: z.array(reference("posts")).optional(),
    slug: z.string().optional(),
  }),
});

export const collections = { posts };
