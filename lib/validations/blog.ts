import { z } from "zod";
import { BlogCategory, BlogAudience } from "@/app/generated/prisma/enums";

export const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  subtitle: z.string().optional(),
  category: z.nativeEnum(BlogCategory, {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  image: z.string().url("Invalid image URL").or(z.literal("")).optional(),
  excerpt: z.string().max(300, "Excerpt should be less than 300 characters").optional(),
  authorName: z.string().min(1, "Author name is required"),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  content: z.string().min(1, "Content is required"),
  audience: z.nativeEnum(BlogAudience).default(BlogAudience.parents),
  categories: z.array(z.nativeEnum(BlogCategory)).default([]),
  nextSteps: z.array(z.object({
    id: z.number(),
  })).optional(),
  showCallout: z.boolean().default(false),
});

export type BlogFormValues = z.infer<typeof blogSchema>;
