"use client";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import {
  projectSchema,
  milestoneSchema,
  evidenceSchema,
} from "@/lib/validation/forms";
import { categories } from "@/types/impact";
import { useImpact } from "./provider";
import { ConfigNotice } from "./projects";
import { Button } from "./ui/button";
import { TransactionStatus } from "./status";
type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  help?: string;
  wide?: boolean;
};
const projectFields: Field[] = [
  {
    name: "name",
    label: "Project name",
    placeholder: "Give your project a clear, descriptive name",
    wide: true,
  },
  {
    name: "description",
    label: "Project description",
    type: "textarea",
    wide: true,
  },
  { name: "category", label: "Impact category", type: "select" },
  {
    name: "location",
    label: "Geographic location",
    placeholder: "Region, country",
  },
  { name: "beneficiary", label: "Beneficiary or target group" },
  {
    name: "website",
    label: "Public project website",
    type: "url",
    placeholder: "https://",
  },
  {
    name: "objective",
    label: "Impact objective",
    type: "textarea",
    wide: true,
  },
  {
    name: "unit",
    label: "Measurement unit",
    placeholder: "e.g. trees surviving after 12 months",
  },
  { name: "baseline", label: "Baseline", type: "number" },
  { name: "target", label: "Target", type: "number" },
  { name: "deadline", label: "Project deadline", type: "date" },
  {
    name: "requirements",
    label: "Evidence requirements",
    type: "textarea",
    wide: true,
    help: "Specify the reports and corroborating sources needed to support the claim.",
  },
  {
    name: "methodology",
    label: "Public methodology",
    type: "textarea",
    wide: true,
    help: "Explain how outcomes will be measured, including scope and limitations.",
  },
];
const milestoneFields: Field[] = [
  { name: "outcome", label: "Expected outcome", type: "textarea", wide: true },
  { name: "target", label: "Quantitative target", type: "number" },
  { name: "deadline", label: "Milestone deadline", type: "date" },
  { name: "method", label: "Measurement method", type: "textarea", wide: true },
  {
    name: "requirements",
    label: "Required evidence",
    type: "textarea",
    wide: true,
  },
  {
    name: "funding_reference",
    label: "Funding allocation reference",
    help: "An administrative reference only; no funds are transferred.",
  },
  {
    name: "allocation",
    label: "Allocation reference amount (whole units)",
    type: "number",
    help: "Non-negative reference value in the units stated in your funding reference.",
  },
];
export function ImpactForm({
  kind,
  projectId,
  milestoneId,
}: {
  kind: "project" | "milestone" | "evidence";
  projectId?: string;
  milestoneId?: string;
}) {
  const c = useImpact();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busy = [
    "signing",
    "pending",
    "consensus",
    "monitoring_paused",
  ].includes(c.tx.status);
  const fields =
    kind === "project"
      ? projectFields
      : kind === "milestone"
        ? milestoneFields
        : [
            {
              name: "urls",
              label: "Public evidence URLs",
              type: "textarea",
              wide: true,
              placeholder: "https://institution.org/public-report",
              help: "One HTTPS URL per line, up to three. Use public HTML or text; no PDFs, images, or authenticated dashboards.",
            },
            {
              name: "explanation",
              label: "Supporting explanation",
              type: "textarea",
              wide: true,
              help: "Connect the evidence to each frozen milestone criterion. Up to 4,000 characters.",
            },
          ];
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const schema =
      kind === "project"
        ? projectSchema
        : kind === "milestone"
          ? milestoneSchema
          : evidenceSchema;
    const data =
      kind === "evidence"
        ? {
            ...raw,
            urls: String(raw.urls)
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : raw;
    const result = schema.safeParse(data);
    if (!result.success) {
      const out: Record<string, string> = {};
      for (const issue of result.error.issues)
        out[String(issue.path[0])] = issue.message;
      setErrors(out);
      return;
    }
    setErrors({});
    const method =
      kind === "project"
        ? "create_project"
        : kind === "milestone"
          ? "add_milestone"
          : "submit_evidence";
    const body = JSON.stringify(result.data);
    await c.write(
      method,
      kind === "project"
        ? [body]
        : [kind === "milestone" ? projectId! : milestoneId!, body],
    );
  }
  return (
    <>
      <ConfigNotice />
      <form className="panel impact-form" onSubmit={handleSubmit} noValidate>
        <div className="form-intro">
          <LockKeyhole size={18} />
          <p>
            {kind === "project"
              ? "Project details are recorded on-chain and public. Your connected wallet is the creator."
              : kind === "milestone"
                ? "Milestone criteria are immutable. Review every field before signing."
                : "Evidence submission is immutable. Review URLs and explanations before signing."}
          </p>
        </div>
        <div className="form-grid">
          {fields.map((f) => (
            <div className={f.wide ? "field field-wide" : "field"} key={f.name}>
              <label htmlFor={f.name}>
                {f.label} <span>*</span>
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={f.name}
                  name={f.name}
                  rows={4}
                  maxLength={kind === "evidence" ? 4000 : 2000}
                  placeholder={f.placeholder}
                  aria-invalid={!!errors[f.name]}
                  aria-describedby={`${f.name}-help ${f.name}-error`}
                />
              ) : f.type === "select" ? (
                <select
                  id={f.name}
                  name={f.name}
                  aria-invalid={!!errors[f.name]}
                >
                  <option value="">Select an impact category</option>
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              ) : (
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type || "text"}
                  min={f.type === "number" ? 0 : undefined}
                  max={f.type === "number" ? 1e12 : undefined}
                  step={f.name === "allocation" ? 1 : "any"}
                  defaultValue={
                    f.name === "baseline" || f.name === "allocation"
                      ? 0
                      : undefined
                  }
                  maxLength={f.type === "url" ? 500 : 200}
                  placeholder={f.placeholder}
                  aria-invalid={!!errors[f.name]}
                  aria-describedby={`${f.name}-help ${f.name}-error`}
                />
              )}
              <small id={`${f.name}-help`}>{f.help}</small>
              {errors[f.name] && (
                <span
                  id={`${f.name}-error`}
                  className="field-error"
                  role="alert"
                >
                  {errors[f.name]}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="form-footer">
          <p>
            {!c.account
              ? "Connect a wallet to continue."
              : !c.ready
                ? "Writes unlock after contract configuration is verified."
                : c.wrongNetwork
                  ? "Switch to studionet to continue."
                  : "You will be asked to sign a real GenLayer transaction."}
          </p>
          <Button
            type="submit"
            disabled={!c.ready || !c.account || c.wrongNetwork || busy}
          >
            {busy
              ? "Transaction in progress…"
              : kind === "project"
                ? "Register project"
                : kind === "milestone"
                  ? "Create milestone"
                  : "Submit evidence"}
            <ArrowUpRight size={16} />
          </Button>
        </div>
        <TransactionStatus tx={c.tx} />
        {c.tx.status === "monitoring_paused" && (
          <Button type="button" onClick={c.resume}>
            Resume monitoring
          </Button>
        )}
      </form>
    </>
  );
}
export type ProjectInput = z.infer<typeof projectSchema>;
