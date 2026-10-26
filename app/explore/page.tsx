import { ProjectExplorer } from "@/components/projects";
export default function Explore() {
  return (
    <div className="wrap page">
      <div className="eyebrow">THE PUBLIC IMPACT REGISTRY</div>
      <h1>
        Explore the evidence.
        <br />
        <span>Follow the impact.</span>
      </h1>
      <p className="page-description">
        Discover projects with measurable goals, public evidence, and
        accountable milestone decisions.
      </p>
      <ProjectExplorer />
    </div>
  );
}
