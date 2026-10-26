"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useImpact } from "./provider";
import { useProjects, ConfigNotice, Empty } from "./projects";
import { Status } from "./status";
import { read } from "@/lib/genlayer/client";
import type { Milestone } from "@/types/impact";
import { Button } from "./ui/button";
export function Activity() {
  const c = useImpact();
  const { projects, loading, error, more, page, setPage } = useProjects();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [failure, setFailure] = useState<string>();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!c.ready) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) setBusy(true);
    });
    (async () => {
      const result: Milestone[] = [];
      for (const p of projects) {
        const rows = await Promise.all(
          Array.from({ length: p.milestone_count }, (_, i) =>
            read<Milestone>("get_milestone", [`${p.id}:${i + 1}`]),
          ),
        );
        result.push(...rows);
      }
      if (active) {
        setMilestones(result);
        setFailure(undefined);
      }
    })()
      .catch((e) => {
        if (active) setFailure(String(e));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [projects, c.ready, c.revision]);
  return (
    <>
      <ConfigNotice />
      {error || failure ? (
        <p role="alert">
          Could not read verification activity: {error || failure}
        </p>
      ) : loading || busy ? (
        <p role="status">Reading finalized milestone activity…</p>
      ) : milestones.length ? (
        <div className="activity-table">
          <div className="activity-header">
            <span>Milestone</span>
            <span>Status</span>
            <span>Deadline</span>
          </div>
          {milestones.map((m) => (
            <Link
              key={m.id}
              href={`/projects/${m.project_id}/milestones/${m.id.split(":")[1]}`}
            >
              <span>
                <small>
                  PROJECT {m.project_id} · MILESTONE {m.id.split(":")[1]}
                </small>
                <b>{m.outcome}</b>
              </span>
              <Status value={m.status} />
              <span>{m.deadline}</span>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="A public record of every decision."
          description="No finalized milestone activity to display. Verification records appear here after projects and milestones are recorded on-chain."
        />
      )}
      {(page > 0 || more) && (
        <div className="pagination">
          <Button disabled={!page} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>Project page {page + 1}</span>
          <Button disabled={!more} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </>
  );
}
