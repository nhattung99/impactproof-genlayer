import { z } from "zod";
import { categories } from "@/types/impact";
const text = (max = 2000) =>
  z.string().trim().min(1, "This field is required").max(max);
export const publicUrl = z
  .string()
  .max(500)
  .refine((value) => {
    try {
      const u = new URL(value);
      const h = u.hostname.toLowerCase();
      return (
        u.protocol === "https:" &&
        !u.username &&
        !u.password &&
        (!u.port || u.port === "443") &&
        /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(h) &&
        h.includes(".") &&
        !h.split(".").some((x) => !x) &&
        !h.replaceAll(".", "").match(/^\d+$/) &&
        !/\.(local|localhost|internal|test|invalid)$/.test(h) &&
        !/\.(pdf|png|jpg|jpeg|gif|zip)$/i.test(u.pathname)
      );
    } catch {
      return false;
    }
  }, "Use a public HTTPS HTML or text report URL");
const amount = z.coerce.number().finite().min(0).max(1e12);
const deadline = text(10)
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !Number.isNaN(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s,
    "Use a valid date",
  );
export const projectSchema = z
  .object({
    name: text(200),
    description: text(),
    category: z.enum(categories),
    location: text(200),
    beneficiary: text(200),
    website: publicUrl,
    objective: text(),
    unit: text(200),
    baseline: amount,
    target: amount.positive(),
    deadline,
    requirements: text(),
    methodology: text(),
  })
  .refine((p) => p.target > p.baseline, {
    path: ["target"],
    message: "Target must exceed baseline",
  });
export const milestoneSchema = z.object({
  outcome: text(),
  target: amount.positive(),
  method: text(),
  deadline,
  requirements: text(),
  funding_reference: text(),
  allocation: amount.int(),
});
export const evidenceSchema = z.object({
  urls: z
    .array(publicUrl)
    .min(1)
    .max(3)
    .refine((u) => new Set(u).size === u.length, "Use distinct URLs"),
  explanation: text(4000),
});
