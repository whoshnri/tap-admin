import { z } from "zod";
import { Roles } from "@/app/generated/prisma/enums";

export const addAdminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Must be a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(Roles),
  master_key: z.string().min(1, "Master key is required"),
});

export const editRoleSchema = z.object({
  role: z.nativeEnum(Roles),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  master_key: z.string().min(1, "Master key is required"),
});

export type AddAdminFormData = z.infer<typeof addAdminSchema>;
export type EditRoleFormData = z.infer<typeof editRoleSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
