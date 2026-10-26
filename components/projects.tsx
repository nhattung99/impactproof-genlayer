"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  FolderOpen,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useImpact } from "./provider";
import { read } from "@/lib/genlayer/client";
import { categories, type Project } from "@/types/impact";
import { Button } from "./ui/button";
export function ConfigNotice() {
  const c = useImpact();
  return (
    <div className="config-notice">
      <ShieldCheck size={18} />
      <div>
        <b>
          {c.checking
            ? "Checking contract"
            : c.ready
              ? "Studionet contract verified"
              : "Awaiting contract deployment"}
        </b>
        <p>{c.configMessage}</p>
      </div>
      {!c.ready && (
        <button aria-label="Retry configuration check" onClick={c.refresh}>
          <RefreshCw size={16} />
        </button>
      )}
    </div>
  );
}
export function Empty({
  title = "The next impact story starts here.",
  description = "No registered projects to display yet. Register a project to begin building a verifiable public record.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <FolderOpen size={28} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <Button asChild size="sm">
        <Link href="/projects/new">
          <Plus size={15} />
          Register a project
        </Link>
      </Button>
    </div>
  );
}
export function useProjects() {
  const c = useImpact();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [more, setMore] = useState(false);
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (!c.ready) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setLoading(true);
        setError(undefined);
      }
    });
    read<Project[]>("list_projects", [page * 50, 50])
      .then((p) => {
        if (active) {
          setProjects(p);
          setMore(p.length === 50);
        }
      })
      .catch((e) => {
        if (active) setError(String(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [c.ready, c.revision, page]);
  return { projects, loading, error, more, page, setPage };
}
export function ProjectExplorer({
  compact = false,
  walletOnly = false,
}: {
  compact?: boolean;
  walletOnly?: boolean;
}) {
  const c = useImpact();
  const { projects, loading, error, more, page, setPage } = useProjects();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("category");
    if (v && categories.includes(v as (typeof categories)[number]))
      queueMicrotask(() => setCategory(v));
  }, []);
  const visible = projects.filter(
    (p) =>
      (!walletOnly || p.creator.toLowerCase() === c.account?.toLowerCase()) &&
      (category === "All categories" || p.category === category) &&
      `${p.name} ${p.location} ${p.objective}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="explorer">
      <div className="explorer-toolbar">
        <div className="input-search">
          <Search size={17} />
          <input
            aria-label="Search projects"
            placeholder="Search projects or locations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="select-wrap">
          <SlidersHorizontal size={15} />
          <select
            aria-label="Filter category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All categories</option>
            {categories.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <span className="record-source">FINALIZED ON-CHAIN RECORDS</span>
      </div>
      <ConfigNotice />
      {error ? (
        <div className="notice" role="alert">
          Could not read projects: {error}
          <Button variant="outline" size="sm" onClick={c.refresh}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="empty" role="status">
          Loading finalized project state…
        </div>
      ) : visible.length ? (
        <div className="project-grid">
          {visible.slice(0, compact ? 3 : 50).map((p) => (
            <Link
              href={`/projects/${p.id}`}
              key={p.id}
              className="project-card"
            >
              <div className="project-card-top">
                <span className="badge">{p.category}</span>
                <ArrowUpRight size={18} />
              </div>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <div className="project-location">
                <MapPin size={14} />
                {p.location}
              </div>
              <div className="project-goal">
                <span>Target outcome</span>
                <strong>
                  {p.target.toLocaleString()} {p.unit}
                </strong>
              </div>
              <div className="project-bottom">
                <span>{p.milestone_count} milestones</span>
                <span>View project →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title={
            search || category !== "All categories"
              ? "No projects match these filters."
              : undefined
          }
          description={
            search || category !== "All categories"
              ? "Try another category or search term. Filters apply to this page of records."
              : c.ready
                ? undefined
                : "The public registry will be available after a deployed contract is configured. No project or verification data is simulated."
          }
        />
      )}{" "}
      {(page > 0 || more) && (
        <div className="pagination">
          <Button
            size="sm"
            disabled={!page}
            onClick={() => setPage((v) => v - 1)}
          >
            Previous
          </Button>
          <span>Page {page + 1}</span>
          <Button
            size="sm"
            disabled={!more}
            onClick={() => setPage((v) => v + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
