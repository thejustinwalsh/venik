import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Documentation pages. The folder is the section and `order` sorts pages
 * within it; see src/lib/docs.ts for how the sidebar is built.
 */
const docs = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number(),
  }),
});

export const collections = { docs };
