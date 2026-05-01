import { z } from "zod";
import { StoreCategory } from "@/app/generated/prisma/enums";

const zodUrl = z.union([
  z.literal("/toolkit-placeholder.png"),
  z.string().url(),
]);

export const storeItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: zodUrl,
  category: z.nativeEnum(StoreCategory),
  desc: z.string().min(10, "Description must be at least 10 characters"),
  price: z.preprocess((val) => parseFloat(val as string), z.number().min(0, "Price must be 0 or more")),
  downloadLink: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  goodFor: z.string().optional().nullable(),
  cta: z.string().min(1, "CTA is required").default("Buy Now"),
  beaconLink: z.string().optional().nullable(),
  bundleId: z.number().nullable().optional(),
  free: z.boolean().default(false),
});

export type StoreItemFormData = z.infer<typeof storeItemSchema>;