import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBlogCategory(category: string) {
  if (!category) return "";
  if (category.toLowerCase() === "sen") return "SEN";
  return category
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatBlogAudience(audience: string) {
  if (!audience) return "";
  return audience.charAt(0).toUpperCase() + audience.slice(1);
}
