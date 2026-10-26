import Link from "next/link";
import { ProjectDetail } from "@/components/project-detail";
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="wrap page">
      <Link className="back-link" href="/explore">
        ← All projects
      </Link>
      {/^\d{1,4}$/.test(id) ? (
        <ProjectDetail id={id} />
      ) : (
        <h1>Invalid project ID</h1>
      )}
    </div>
  );
}
