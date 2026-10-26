import { ImpactForm } from "@/components/forms";
export default function NewProject() {
  return (
    <div className="wrap page narrow">
      <div className="eyebrow">START A PUBLIC IMPACT RECORD</div>
      <h1>Register your project.</h1>
      <p className="page-description">
        Define the mission, measurement, and evidence standard. Then build your
        milestones around it.
      </p>
      <ImpactForm kind="project" />
    </div>
  );
}
