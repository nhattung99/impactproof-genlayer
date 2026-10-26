# ImpactProof — Verifiable Real-World Impact

**Real impact. Verifiable decisions. Accountable funding.**

ImpactProof makes environmental and public-benefit funding accountable to evidence. Creators define measurable milestones, submit public textual reports, and request a GenLayer Intelligent Contract decision. Public users inspect the frozen criteria, evidence, reasoning, limitations, and funding eligibility.

## Current status

The owner has deployed the Intelligent Contract on stable GenLayer studionet. Read-only RPC verification confirmed that the deployed source matches this repository, all ten public methods match, and finalized reads report `impactproof/1`. No financial transfer or real-wallet end-to-end test is claimed.

## Live App

[https://impactproof-genlayer.vercel.app](https://impactproof-genlayer.vercel.app)

Production HTTP verification returned **200 OK**. The first 4,000 HTML characters contain the ImpactProof title and the React application root. Vercel is connected to the public [GitHub repository](https://github.com/nhattung99/impactproof-genlayer); pushes to `main` trigger deployment.

## Deployed Contract

- Network: **GenLayer studionet**
- Address: `0xCea7D28DB1FBBAC0797C0F3c1B7b4c5f614EAD6e`
- [GenLayer Explorer](https://genlayer-explorer.vercel.app/address/0xCea7D28DB1FBBAC0797C0F3c1B7b4c5f614EAD6e)
- [Studio Explorer](https://explorer-studio.genlayer.com/address/0xCea7D28DB1FBBAC0797C0F3c1B7b4c5f614EAD6e)

The contract source SHA-256 returned by Studio is `93f0de16be074008e2cfe730d9485c6a828bcc5ff332d3767474d3f941705409`. The initial finalized project list is empty; no activity is simulated.

## Why GenLayer

Source credibility, relevance, contradictory observations, and adequacy against a methodology require judgment. The Python contract retrieves sources using `gl.nondet.web.render`, evaluates them using `gl.nondet.exec_prompt`, and uses validator equivalence to reach a substantive decision. No backend or centralized AI service generates the verdict.

The comparative principle checks the same decision and materially equivalent reasoning. A second independent evaluation uses strict equality **only on the decision enum**, never on free-form reasoning. A mismatch aborts the write. This favors failed consensus over quietly accepting opposing judgments. Strict voting can reduce liveness when evidence is ambiguous or sources change; measure costs and disagreement in Studio before wider use.

## Stack and structure

Next.js 16 App Router, strict TypeScript, React 19, Tailwind 4, a shadcn-style Radix/CVA button primitive, Lucide, Zod, and official `genlayer-js@1.1.8`. No database, server verdict generator, or external indexing service.

```text
app/                     Eight application routes and responsive styles
components/              Wallet provider, forms, explorer, detail and verdict UI
components/ui/           Accessible reusable primitives
contracts/impact_proof.py Pinned stable Studio Intelligent Contract
lib/genlayer/            Reads, writes, deployment/interface validation
lib/validation/          Project, milestone, evidence schemas
types/                   Shared on-chain record types
tests/contract/          Host-Python logic tests with explicit test doubles
tests/direct/            Official SDK direct-mode tests (in memory)
tests/frontend/          Vitest unit/component tests
tests/e2e/               Public smoke and opt-in real-wallet integration specs
scripts/check-contract.mjs Read-only Studio schema compilation, never deployment
docs/                    Architecture, security, test, deployment and submission guides
docs/references/         Official SDK and full documentation snapshots
```

## Run locally

Requires Node.js 22+ (validated with 24.14.0), npm, and Python 3.12+ for contract tests.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open the printed local URL. Set `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS` in `.env.local` to the deployed address above. `NEXT_PUBLIC_GENLAYER_NETWORK` must be `studionet`. The chain ID, RPC URL, and wallet network configuration come from the SDK's bundled `studionet` object; do not substitute public testnet or preview configuration.

After manual deployment set the actual address in `.env.local`, restart/rebuild, and validate integration. Writes require a nonempty deployed source, the expected public method schema, and finalized `interface_version() == "impactproof/1"`.

## Contract interface

Public writes:

| Method             | Arguments                  | Behavior                                                        |
| ------------------ | -------------------------- | --------------------------------------------------------------- |
| `create_project`   | JSON string                | Registers a project; sender becomes creator; returns ID         |
| `add_milestone`    | project ID, JSON string    | Creator-only immutable criteria; returns `project:milestone` ID |
| `submit_evidence`  | milestone key, JSON string | Creator-only single immutable evidence submission               |
| `verify_milestone` | milestone key              | Creator-only evaluation; commits at most one verdict            |

Views: `interface_version()`, `list_projects(offset, limit)`, `get_project(id)`, `get_milestone(key)`, `get_evidence(key)`, `get_verdict(key)`. Entity views return JSON strings; absent evidence/verdict return `"null"`. List page size is at most 50. Milestone URLs use the numeric child ID while SDK calls use the full `project:milestone` key.

Project JSON: `name`, `description`, `category`, `location`, `beneficiary`, `website`, `objective`, `unit`, `baseline`, `target`, `deadline`, `requirements`, `methodology`. The wallet is derived on-chain, never trusted from input.

Milestone JSON: `outcome`, `target`, `method`, `deadline`, `requirements`, `funding_reference`, `allocation`. Allocation is an integer reference amount, not a deposit or token balance. State its units in `funding_reference`.

Evidence JSON: `urls` (1–3 distinct HTTPS report URLs), `explanation`. Dates use `YYYY-MM-DD`. Text is bounded; see source for exact limits.

## Validate

```powershell
npm run typecheck
npm run lint
npm test
npm run test:contract
npm run build
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt
.venv/Scripts/python -m pytest tests/direct -v
node scripts/check-contract.mjs
```

The last command contacts stable Studio to generate a schema without deploying or signing. The contract runner is pinned to the **observed Studio v0.2.16 template**, not the incompatible latest v0.3 reference. See [research notes](docs/RESEARCH.md). Builds use webpack because Turbopack worker creation failed on this Windows host.

See [test results and boundaries](docs/TESTING.md), [manual deployment](docs/DEPLOYMENT.md), [architecture](docs/ARCHITECTURE.md), and [security](docs/SECURITY.md).

## Limitations and risks

- A public report supports a claim; it cannot prove physical reality. Model/validator agreement does not guarantee truth.
- No escrow, funds transfer, appeals UI, revision workflow, or external audit certification.
- One submission and one verdict per milestone. NEEDS_REVIEW is immutable; define a clearly distinguished follow-up milestone for additional evidence.
- Web content is mutable. Integrity hashes identify retrieved content; full page snapshots are not stored.
- Up to 1,000 projects, 20 milestones each, 3 reports per submission. Registry capacity is a deliberate MVP bound, not an abuse-resistant admission system.
- No global transaction index. Public audit records contain criteria, evidence, hashes, and verdicts. This browser retains its latest submitted transaction reference; use Studio for the full chain transaction history. Local storage is not authoritative.
- Search/filtering and wallet project filtering operate on each registry page. Activity reads milestone state for each project on that page, not a globally indexed chronological event feed.
- Official SDK direct tests mock nondeterministic inputs. Real wallet signing, web retrieval, validator disagreement/appeals, and finalized writes require owner deployment and integration validation.

Public hosting is authorized by the owner. Wallet signing and live multi-validator evaluation remain explicit integration checks before claiming a fully validated end-to-end workflow.

MIT licensed; see [LICENSE](LICENSE).
