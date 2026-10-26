export const categories = [
  "Reforestation",
  "Renewable energy",
  "Clean water",
  "Waste reduction",
  "Biodiversity",
  "Community infrastructure",
] as const;
export type Project = {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  beneficiary: string;
  website: string;
  objective: string;
  unit: string;
  baseline: number;
  target: number;
  deadline: string;
  requirements: string;
  methodology: string;
  creator: string;
  milestone_count: number;
  created_at: string;
};
export type Milestone = {
  id: string;
  project_id: string;
  outcome: string;
  target: number;
  method: string;
  deadline: string;
  requirements: string;
  funding_reference: string;
  allocation: number;
  status: string;
};
export type Evidence = {
  urls: string[];
  explanation: string;
  submitted_at: string;
  submitter: string;
  submission_sha256: string;
};
export type Verdict = {
  project_id: string;
  milestone_id: string;
  decision: "APPROVED" | "REJECTED" | "NEEDS_REVIEW";
  reason: string;
  limitations: string;
  evaluated_at: string;
  methodology: string;
  evidence_submission_sha256: string;
  funding_eligible: boolean;
  sources: {
    url: string;
    available: boolean;
    sha256: string;
    truncated: boolean;
  }[];
};
export type TxState = {
  hash?: `0x${string}`;
  method?: string;
  status:
    | "idle"
    | "signing"
    | "pending"
    | "consensus"
    | "finalized"
    | "failed"
    | "monitoring_paused";
  message?: string;
  contract?: string;
};
