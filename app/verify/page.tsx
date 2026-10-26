import { Activity } from "@/components/activity";
export default function Verify() {
  return (
    <div className="wrap page">
      <div className="eyebrow">TRANSPARENT BY DEFAULT</div>
      <h1>The verification record.</h1>
      <p className="page-description">
        Inspect milestone status and finalized decisions. Open a milestone to
        review its evidence, reasoning, and limitations.
      </p>
      <Activity />
    </div>
  );
}
