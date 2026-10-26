import { Layers3, ShieldCheck, Globe2, FileCheck2 } from "lucide-react";
export default function About() {
  return (
    <div className="wrap page prose">
      <div className="eyebrow">THE VERIFICATION ARCHITECTURE</div>
      <h1>
        Trust the evidence.
        <br />
        <span>Inspect the judgment.</span>
      </h1>
      <p className="page-description">
        ImpactProof connects public evidence to accountable funding decisions
        through GenLayer Intelligent Contracts.
      </p>
      <div className="feature-grid">
        {[
          [
            FileCheck2,
            "Frozen criteria",
            "Creators define outcomes, targets, methods, deadlines, and evidence requirements before submission. No editing endpoints can silently change these criteria.",
          ],
          [
            Globe2,
            "Public evidence",
            "The contract retrieves up to three public HTTPS text reports through GenLayer web access. Sources are untrusted observations, never instructions.",
          ],
          [
            Layers3,
            "Substantive consensus",
            "Validators independently assess the milestone. Comparative reasoning and an exact decision vote must agree before any verdict is persisted.",
          ],
        ].map(([Icon, title, desc]) => {
          const I = Icon as typeof Layers3;
          return (
            <article className="feature-card" key={String(title)}>
              <I />
              <h3>{String(title)}</h3>
              <p>{String(desc)}</p>
            </article>
          );
        })}
      </div>
      <section className="panel">
        <h2>A decision you can inspect</h2>
        <p>
          Every verdict records APPROVED, REJECTED, or NEEDS_REVIEW, together
          with reasoning, limitations, source integrity metadata, chain time,
          and a methodology version. The public dashboard reads finalized state.
          A submitted transaction is never presented as a finalized decision.
        </p>
        <h3>What approval means</h3>
        <p>
          An APPROVED verdict records eligibility for a subsequent funding
          action. ImpactProof phase one has no escrow and transfers no funds. A
          report can support a claim; it cannot independently prove physical
          reality.
        </p>
        <h3>When certainty is not justified</h3>
        <p>
          Unavailable sources, uncorroborated claims, missing measurements,
          contradictory evidence, and unclear methodologies should produce
          NEEDS_REVIEW. There are no invented confidence percentages.
        </p>
        <div className="architecture-note">
          <ShieldCheck />
          <p>
            GenLayer performs the subjective evaluation and reaches consensus.
            The frontend does not generate, edit, or override verdicts.
          </p>
        </div>
      </section>
      <section className="panel">
        <h2>Designed for an honest MVP</h2>
        <p>
          Studionet is a development environment. Public reports may change,
          contain misleading content, or attempt prompt injection. Consensus
          checks agreement under the methodology; it does not guarantee factual
          truth. Independent field validation remains valuable.
        </p>
        <a
          className="text-link"
          href="https://docs.genlayer.com/understand-genlayer-protocol"
        >
          Read the GenLayer protocol documentation ↗
        </a>
      </section>
    </div>
  );
}
