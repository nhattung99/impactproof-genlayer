import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Globe2,
  Layers3,
  FileCheck2,
  Leaf,
  Wind,
  Droplets,
  Recycle,
  Flower2,
  Building2,
  Check,
  LockKeyhole,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectExplorer } from "@/components/projects";
export default function Home() {
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> VERIFIABLE IMPACT, BY DESIGN
          </div>
          <h1>
            Good intentions.
            <br />
            Real evidence.
            <br />
            <span>Provable impact.</span>
          </h1>
          <p className="hero-description">
            Bring accountability to real-world funding. Turn public evidence
            into verifiable milestone decisions with GenLayer’s decentralized AI
            consensus.
          </p>
          <div className="hero-buttons">
            <Button asChild>
              <Link href="/explore">
                Explore projects <ArrowUpRight size={17} />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/projects/new">
                Register a project <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <div className="hero-trust">
            <ShieldCheck size={16} />
            <span>On-chain decisions</span>
            <b>·</b>
            <span>Public evidence</span>
            <b>·</b>
            <span>Accountable funding</span>
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label="Diagram of public evidence becoming a verified on-chain decision"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="globe">
            <div className="globe-lines" />
            <Globe2 size={220} strokeWidth={0.45} />
            <div className="globe-core">
              <Leaf size={36} />
            </div>
          </div>
          <div className="float-card evidence-card">
            <div className="mini-icon">
              <FileCheck2 size={18} />
            </div>
            <div>
              <small>01 / INPUT</small>
              <strong>Public evidence</strong>
              <span>Reports · datasets · methodology</span>
            </div>
            <Check size={16} />
          </div>
          <div className="float-card consensus-card">
            <div className="mini-icon purple">
              <Layers3 size={18} />
            </div>
            <div>
              <small>02 / EVALUATE</small>
              <strong>GenLayer consensus</strong>
              <span>Independent validator judgment</span>
            </div>
          </div>
          <div className="float-card decision-card">
            <ShieldCheck size={24} />
            <div>
              <small>03 / RECORD</small>
              <strong>An accountable decision</strong>
              <span>Transparent. Persistent. On-chain.</span>
            </div>
          </div>
          <span className="visual-caption">
            VERIFICATION ARCHITECTURE <span>↗</span>
          </span>
        </div>
      </section>
      <div className="principles-strip">
        <div className="wrap">
          <span>
            TRUST THE PROCESS.
            <br />
            <b>VERIFY THE OUTCOME.</b>
          </span>
          <p>
            <Globe2 />
            Publicly inspectable
          </p>
          <p>
            <Layers3 />
            Validator consensus
          </p>
          <p>
            <LockKeyhole />
            Immutable criteria
          </p>
          <p>
            <ShieldCheck />
            Funding eligibility
          </p>
        </div>
      </div>
      <section className="section wrap">
        <div className="section-heading">
          <div>
            <div className="eyebrow">THE ACCOUNTABILITY GAP</div>
            <h2>
              Promises are easy.
              <br />
              Proof takes a better system.
            </h2>
          </div>
          <p>
            Funding moves on reports and good faith. ImpactProof makes the
            evidence, evaluation, and decision visible to everyone involved.
          </p>
        </div>
        <div className="feature-grid">
          {[
            [
              FileCheck2,
              "Evidence over assertions",
              "Public sources are assessed against predefined, measurable milestones. A link alone is never proof.",
            ],
            [
              Layers3,
              "Judgment without a single gatekeeper",
              "GenLayer validators evaluate substantive outcomes, including missing and contradictory evidence.",
            ],
            [
              ShieldCheck,
              "Accountability before allocation",
              "An approved milestone records funding eligibility. Every decision includes its reasoning and limitations.",
            ],
          ].map(([Icon, title, description], i) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <article className="feature-card" key={String(title)}>
                <div className="feature-top">
                  <I size={24} />
                  <span>0{i + 1}</span>
                </div>
                <h3>{String(title)}</h3>
                <p>{String(description)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="section process-section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <div className="eyebrow">FROM CLAIM TO CONSENSUS</div>
              <h2>A clear path to credible impact.</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/about">
                Inside the architecture <ArrowUpRight size={16} />
              </Link>
            </Button>
          </div>
          <div className="process-grid">
            {[
              [
                "01",
                "Define the outcome",
                "Register a project and set measurable, immutable milestone criteria.",
              ],
              [
                "02",
                "Submit the evidence",
                "Attach public reports, source URLs, and the methodology behind your claims.",
              ],
              [
                "03",
                "Let validators evaluate",
                "GenLayer retrieves sources and reaches consensus on the substantive decision.",
              ],
              [
                "04",
                "Make funding accountable",
                "Inspect the verdict, reasoning, and eligibility for the next funding action.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span className="step-number">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
          <div className="architecture-note">
            <ScanLine size={21} />
            <p>
              <b>Intelligence in the contract.</b> Evidence is evaluated inside
              GenLayer’s nondeterministic execution. The application displays
              the chain’s decision.
            </p>
            <span>
              GENLAYER NATIVE <ArrowUpRight size={14} />
            </span>
          </div>
        </div>
      </section>
      <section className="section wrap">
        <div className="section-heading">
          <div>
            <div className="eyebrow">REAL-WORLD POSSIBILITIES</div>
            <h2>Different missions. The same standard of proof.</h2>
          </div>
        </div>
        <div className="category-grid">
          {[
            [Leaf, "Reforestation"],
            [Wind, "Renewable energy"],
            [Droplets, "Clean water"],
            [Recycle, "Waste reduction"],
            [Flower2, "Biodiversity"],
            [Building2, "Community infrastructure"],
          ].map(([Icon, title]) => {
            const I = Icon as typeof Leaf;
            return (
              <Link
                href={`/explore?category=${encodeURIComponent(String(title))}`}
                key={String(title)}
              >
                <I size={23} />
                <span>{String(title)}</span>
                <ArrowUpRight size={15} />
              </Link>
            );
          })}
        </div>
      </section>
      <section className="section wrap">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> THE PUBLIC RECORD
            </div>
            <h2>Impact, out in the open.</h2>
          </div>
          <Link className="text-link" href="/verify">
            View verification activity <ArrowRight size={16} />
          </Link>
        </div>
        <ProjectExplorer compact />
      </section>
      <section className="cta wrap">
        <div>
          <div className="eyebrow">BUILD TRUST INTO YOUR NEXT MILESTONE</div>
          <h2>
            Make your impact
            <br />
            stand up to scrutiny.
          </h2>
          <p>
            Start with a measurable goal. Build a public record of the evidence.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            Register your project <ArrowUpRight size={18} />
          </Link>
        </Button>
      </section>
    </>
  );
}
