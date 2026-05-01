import type { Admins, ContactForm, Memo } from "@/app/generated/prisma/client";

export type Session = Omit<Admins, "password" | "updatedAt" | "createdAt">;

export type MemoWithRelations = Memo & {
  author: Admins;
  recipients: Admins[];
  readBy: Admins[];
};

export type ContactFormWithReadBy = ContactForm & {
  readBy: Admins[];
};
