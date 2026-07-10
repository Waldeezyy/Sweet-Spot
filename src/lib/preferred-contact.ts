import { z } from "zod";
import type { PreferredContactMethod } from "@prisma/client";

export const PREFERRED_CONTACT_OPTIONS = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone call or text" },
  { value: "EITHER", label: "Either — no preference" },
] as const satisfies ReadonlyArray<{ value: PreferredContactMethod; label: string }>;

export function hasMultipleContactMethods(phone?: string | null): boolean {
  return Boolean(phone?.trim());
}

export function preferredContactLabel(method?: PreferredContactMethod | null): string | null {
  if (!method) return null;
  return PREFERRED_CONTACT_OPTIONS.find((option) => option.value === method)?.label ?? null;
}

export function normalizePreferredContact(
  phone?: string | null,
  method?: PreferredContactMethod | string | null
): PreferredContactMethod | null {
  if (!hasMultipleContactMethods(phone)) return null;
  if (method === "EMAIL" || method === "PHONE" || method === "EITHER") return method;
  return null;
}

export const preferredContactMethodSchema = z.enum(["EMAIL", "PHONE", "EITHER"]);

export function withPreferredContactValidation<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).superRefine((data, ctx) => {
    const record = data as { customerPhone?: string; preferredContactMethod?: PreferredContactMethod };
    if (hasMultipleContactMethods(record.customerPhone) && !record.preferredContactMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please choose a preferred contact method.",
        path: ["preferredContactMethod"],
      });
    }
  });
}
