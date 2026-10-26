"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, ArrowUpRight, Plus, ExternalLink } from "lucide-react";
import { useImpact } from "./provider";
import { read } from "@/lib/genlayer/client";
import type { Project, Milestone } from "@/types/impact";
import { ConfigNotice } from "./projects";
import { Status } from "./status";
import { ImpactForm } from "./forms";
import { Button } from "./ui/button";
export function ProjectDetail({ id }: { id: string }) {
  const c = useImpact();
  const [p, setProject] = useState<Project>();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [error, setError] = useState<string>();
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    if (!c.ready) return;
    let active = true;
    read<Project>("get_project", [id])
      .then(async (project) => {
        const m = await Promise.all(
          Array.from({ length: project.milestone_count }, (_, i) =>
            read<Milestone>("get_milestone", [`${id}:${i + 1}`]),
          ),
        );
        if (active) {
          setProject(project);
          setMilestones(m);
          setError(undefined);
        }
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, [c.ready, c.revision, id]);
  if (!c.ready) return <ConfigNotice />;
  if (error)
    return (
      <div role="alert" className="notice">
        Could not load project: {error}
        <Button onClick={c.refresh}>Retry</Button>
      </div>
    );
  if (!p) return <p role="status">Loading finalized project…</p>;
  const owner = p.creator.toLowerCase() === c.account?.toLowerCase();
  return (
    <>
      <div className="eyebrow">PROJECT / {p.id}</div>
      <div className="section-heading">
        <div>
          <Status value={p.category} />
          <h1>{p.name}</h1>
          <p className="page-description">{p.description}</p>
          <p className="project-location">
            <MapPin size={16} />
            {p.location}{" "}
            <a href={p.website} target="_blank" rel="noreferrer">
              Project website <ExternalLink size={13} />
            </a>
          </p>
        </div>
      </div>
      <div className="detail-grid">
        <div>
          <section className="panel">
            <h2>Impact objective</h2>
            <p>{p.objective}</p>
            <div className="metrics">
              <div>
                <span>Baseline</span>
                <strong>{p.baseline.toLocaleString()}</strong>
              </div>
              <div>
                <span>Target · {p.unit}</span>
                <strong>{p.target.toLocaleString()}</strong>
              </div>
              <div>
                <span>Deadline</span>
                <strong>{p.deadline}</strong>
              </div>
            </div>
            <h3>Public methodology</h3>
            <p className="preserve">{p.methodology}</p>
            <h3>Evidence requirements</h3>
            <p className="preserve">{p.requirements}</p>
          </section>
          <div className="section-heading">
            <h2>Milestones</h2>
            {owner && p.milestone_count < 20 && (
              <Button size="sm" onClick={() => setAdding(!adding)}>
                <Plus size={15} />
                {adding ? "Close form" : "Add milestone"}
              </Button>
            )}
          </div>
          {adding && <ImpactForm kind="milestone" projectId={id} />}
          <div className="milestone-list">
            {milestones.length ? (
              milestones.map((m) => (
                <Link
                  className="panel milestone-row"
                  href={`/projects/${id}/milestones/${m.id.split(":")[1]}`}
                  key={m.id}
                >
                  <div>
                    <span className="muted">
                      MILESTONE {m.id.split(":")[1]}
                    </span>
                    <h3>{m.outcome}</h3>
                    <p>
                      Target: {m.target} {p.unit} · Due {m.deadline}
                    </p>
                  </div>
                  <Status value={m.status} />
                  <ArrowUpRight size={18} />
                </Link>
              ))
            ) : (
              <div className="panel">
                <h3>No milestones yet</h3>
                <p>
                  {owner
                    ? "Add your first milestone with measurable criteria before submitting evidence."
                    : "The creator has not defined milestones yet."}
                </p>
              </div>
            )}
          </div>
        </div>
        <aside>
          <section className="panel">
            <h3>Project record</h3>
            <dl>
              <dt>Creator wallet</dt>
              <dd className="hash">{p.creator}</dd>
              <dt>Beneficiary</dt>
              <dd>{p.beneficiary}</dd>
              <dt>Registered at chain time</dt>
              <dd>{p.created_at}</dd>
              <dt>Record source</dt>
              <dd>Finalized GenLayer state</dd>
            </dl>
          </section>
          <section className="panel">
            <h3>Accountability by design</h3>
            <p>
              Criteria and historical verdicts cannot be rewritten. Funding
              eligibility is a recorded decision; no funds are transferred by
              this application.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
