import { z } from "zod";
import { BundleCategory } from "@/app/generated/prisma/enums";

export const bundleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().url("Invalid image URL"),
  category: z.nativeEnum(BundleCategory),
  desc: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be 0 or more"),
  badge: z.string().optional().nullable(),
  cta: z.string().min(1, "CTA is required").default("Buy Bundle"),
  includes: z.array(z.string()).default([]),
  // IDs of store items to assign to this bundle
  assignedItemIds: z.array(z.number()).default([]),
  total: z.number().min(0).default(0),
});

export type BundleFormData = z.infer<typeof bundleSchema>;
