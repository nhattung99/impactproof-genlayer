import Link from "next/link";
import { MilestoneDetail } from "@/components/milestone-detail";
export default async function MilestonePage({
  params,
}: {
  params: Promise<{ id: string; milestoneId: string }>;
}) {
  const { id, milestoneId } = await params;
  return (
    <div className="wrap page">
      <Link className="back-link" href={`/projects/${id}`}>
        ← Project overview
      </Link>
      {/^\d{1,4}$/.test(id) && /^\d{1,2}$/.test(milestoneId) ? (
        <MilestoneDetail projectId={id} milestoneId={milestoneId} />
      ) : (
        <h1>Invalid milestone ID</h1>
      )}
    </div>
  );
}
