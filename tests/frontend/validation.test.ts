import { describe, it, expect } from "vitest";
import {
  projectSchema,
  milestoneSchema,
  evidenceSchema,
  publicUrl,
} from "@/lib/validation/forms";
const project = {
  name: "Watershed restoration",
  description: "Public environmental initiative",
  category: "Reforestation",
  location: "Vietnam",
  beneficiary: "Local communities",
  website: "https://example.org/report",
  objective: "Increase surviving tree count",
  unit: "surviving trees",
  baseline: 0,
  target: 100,
  deadline: "2027-10-01",
  requirements: "Public audit",
  methodology: "Independent tree sampling",
};
describe("project and evidence input", () => {
  it("accepts a complete measurable project", () =>
    expect(projectSchema.parse(project).target).toBe(100));
  it("rejects empty fields and targets below baseline", () => {
    expect(projectSchema.safeParse({ ...project, name: "  " }).success).toBe(
      false,
    );
    expect(projectSchema.safeParse({ ...project, target: 0 }).success).toBe(
      false,
    );
    expect(projectSchema.safeParse({ ...project, baseline: 101 }).success).toBe(
      false,
    );
  });
  it.each([
    "http://example.org",
    "javascript:alert(1)",
    "https://127.0.0.1/a",
    "https://localhost/a",
    "https://example.local/a",
    "https://user:pass@example.org",
    "https://example.org/a.pdf",
    "https://[::1]",
    "https://example.org:8443",
  ])("rejects unsupported evidence %s", (url) =>
    expect(publicUrl.safeParse(url).success).toBe(false),
  );
  it("rejects duplicate or excessive sources", () => {
    const base = {
      explanation: "Independent corroboration",
      urls: ["https://example.org/a", "https://example.org/a"],
    };
    expect(evidenceSchema.safeParse(base).success).toBe(false);
    expect(evidenceSchema.safeParse({ ...base, urls: [] }).success).toBe(false);
  });
  it("rejects malformed dates and negative funding references", () => {
    expect(
      projectSchema.safeParse({ ...project, deadline: "2027-02-30" }).success,
    ).toBe(false);
    expect(
      milestoneSchema.safeParse({
        outcome: "Measured",
        target: 10,
        deadline: "2027-01-01",
        method: "Survey",
        requirements: "Audit",
        funding_reference: "Grant A",
        allocation: -1,
      }).success,
    ).toBe(false);
  });
});
