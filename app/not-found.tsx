import Link from "next/link";
export default function NotFound() {
  return (
    <div className="wrap page">
      <h1>Page not found.</h1>
      <p className="page-description">Find a project in the public registry.</p>
      <Link className="button button-primary" href="/explore">
        Explore projects
      </Link>
    </div>
  );
}
