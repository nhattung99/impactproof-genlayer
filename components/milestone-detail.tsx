"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { useImpact } from "./provider";
import { read } from "@/lib/genlayer/client";
import type { Project, Milestone, Evidence, Verdict } from "@/types/impact";
import { ConfigNotice } from "./projects";
import { Status, TransactionStatus } from "./status";
import { ImpactForm } from "./forms";
import { Button } from "./ui/button";
export function VerdictCard({ verdict }: { verdict: Verdict }) {
  return (
    <section className="panel verdict-panel">
      <div className="section-heading">
        <h2>
          <ShieldCheck size={23} /> Finalized verdict
        </h2>
        <Status value={verdict.decision} />
      </div>
      <h3>Reasoning</h3>
      <p className="preserve">{verdict.reason}</p>
      <h3>What remains unproven</h3>
      <p className="preserve">{verdict.limitations}</p>
      <dl>
        <dt>Methodology</dt>
        <dd>{verdict.methodology}</dd>
        <dt>Evaluation chain time</dt>
        <dd>{verdict.evaluated_at}</dd>
        <dt>Funding eligibility</dt>
        <dd>
          {verdict.funding_eligible
            ? "Eligible for a subsequent funding action. No transfer has occurred."
            : "Not eligible for funding approval."}
        </dd>
      </dl>
      <h3>Evidence audit</h3>
      {verdict.sources.map((s) => (
        <div className="source" key={s.url}>
          <a href={s.url} target="_blank" rel="noreferrer">
            {s.url}
            <ExternalLink size={13} />
          </a>
          <Status value={s.available ? "RETRIEVED" : "EVIDENCE_UNAVAILABLE"} />
          <small className="hash">
            SHA-256 of retrieved content: {s.sha256 || "unavailable"}
            {s.truncated ? " · Evaluation used first 16,000 characters." : ""}
          </small>
        </div>
      ))}
    </section>
  );
}
export function MilestoneDetail({
  projectId,
  milestoneId,
}: {
  projectId: string;
  milestoneId: string;
}) {
  const c = useImpact();
  const [data, setData] = useState<{
    p: Project;
    m: Milestone;
    e: Evidence | null;
    v: Verdict | null;
  }>();
  const [error, setError] = useState<string>();
  const key = `${projectId}:${milestoneId}`;
  useEffect(() => {
    if (!c.ready) return;
    let active = true;
    Promise.all([
      read<Project>("get_project", [projectId]),
      read<Milestone>("get_milestone", [key]),
      read<Evidence | null>("get_evidence", [key]),
      read<Verdict | null>("get_verdict", [key]),
    ])
      .then(([p, m, e, v]) => {
        if (active) {
          setData({ p, m, e, v });
          setError(undefined);
        }
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, [c.ready, c.revision, key, projectId]);
  if (!c.ready) return <ConfigNotice />;
  if (error)
    return (
      <div role="alert" className="notice">
        Could not read milestone: {error}
        <Button onClick={c.refresh}>Retry</Button>
      </div>
    );
  if (!data) return <p role="status">Loading finalized milestone state…</p>;
  const { p, m, e, v } = data;
  const owner = p.creator.toLowerCase() === c.account?.toLowerCase();
  const busy = [
    "signing",
    "pending",
    "consensus",
    "monitoring_paused",
  ].includes(c.tx.status);
  return (
    <>
      <div className="eyebrow">
        {p.name} / MILESTONE {milestoneId}
      </div>
      <h1>{m.outcome}</h1>
      <Status value={m.status} />
      <div className="detail-grid">
        <div>
          <section className="panel">
            <h2>Frozen verification criteria</h2>
            <div className="metrics">
              <div>
                <span>Target · {p.unit}</span>
                <strong>{m.target}</strong>
              </div>
              <div>
                <span>Deadline</span>
                <strong>{m.deadline}</strong>
              </div>
            </div>
            <h3>Measurement method</h3>
            <p>{m.method}</p>
            <h3>Required evidence</h3>
            <p>{m.requirements}</p>
          </section>
          {e ? (
            <section className="panel">
              <h2>Submitted evidence</h2>
              {e.urls.map((url) => (
                <p key={url}>
                  <a
                    className="text-link"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {url}
                    <ExternalLink size={13} />
                  </a>
                </p>
              ))}
              <p className="preserve">{e.explanation}</p>
              <dl>
                <dt>Submission chain time</dt>
                <dd>{e.submitted_at}</dd>
                <dt>Submission integrity hash</dt>
                <dd className="hash">{e.submission_sha256}</dd>
              </dl>
            </section>
          ) : owner ? (
            <>
              <h2>Submit public evidence</h2>
              <ImpactForm kind="evidence" milestoneId={key} />
            </>
          ) : (
            <div className="panel">
              <h3>Awaiting evidence</h3>
              <p>The creator has not submitted evidence for this milestone.</p>
            </div>
          )}
          {v ? (
            <VerdictCard verdict={v} />
          ) : (
            e && (
              <section className="panel">
                <h2>Request GenLayer verification</h2>
                <p>
                  Validators retrieve the public sources and evaluate them
                  against frozen criteria. Consensus and finality can take time.
                </p>
                <Button
                  disabled={!owner || !c.ready || c.wrongNetwork || busy}
                  onClick={() => void c.write("verify_milestone", [key])}
                >
                  Request verification <ShieldCheck size={17} />
                </Button>
                {!owner && (
                  <p className="muted">
                    Only the project creator can request verification.
                  </p>
                )}
                <TransactionStatus tx={c.tx} />
                {c.tx.status === "monitoring_paused" && (
                  <Button onClick={c.resume}>Resume monitoring</Button>
                )}
              </section>
            )
          )}
        </div>
        <aside>
          <section className="panel">
            <h3>Funding decision layer</h3>
            <p>{m.funding_reference}</p>
            <dl>
              <dt>Reference allocation</dt>
              <dd>{m.allocation.toLocaleString()} reference units</dd>
              <dt>Transfer status</dt>
              <dd>No transfer mechanism enabled</dd>
            </dl>
            <p>
              Approval records eligibility only. Escrow, deposits, releases, and
              refunds are outside phase one.
            </p>
          </section>
          <section className="panel">
            <h3>Audit trail</h3>
            <p>
              Criteria → evidence → immutable verdict. Each record is read from
              finalized on-chain state.
            </p>
            <p>
              Transaction hashes for this browser’s submissions are retained in
              the connected wallet dashboard. A global transaction index is not
              available in this MVP.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
