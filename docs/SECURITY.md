# Security and reliability

## Implemented boundaries

- Creator address is derived from `gl.message.sender_address`; milestone creation, evidence submission, and verification are creator-only.
- No project/milestone/evidence update methods. Historical verdicts cannot be overwritten or finalized twice.
- Only the verification method can record funding eligibility. All public writes are nonpayable. No financial transfer or escrow.
- HTTPS public DNS names only; no credentials, IP literals, local suffixes, nonstandard ports, or common binary evidence formats. Up to three distinct source URLs.
- Bounded JSON inputs, strings, sources, evaluation text, counts, and numeric values. No negative allocations or zero targets.
- Evidence text is untrusted, serialized as data, and explicitly excluded from prompt instructions. Model output must match the verdict schema.
- Comparative substantive evaluation plus independent strict enum agreement. Opposing decisions cannot persist via a format-only equivalence rule.
- Chain reads use `LATEST_FINAL`. UI finality requires both persisted FINALIZED status and successful execution.
- Write locks prevent repeated clicks; pending hashes survive reload. Account/network are rechecked immediately before signing. Wallet rejection and RPC failures are visible.
- React escapes output. No HTML insertion, code execution, contract secrets, or API keys.

## Known risks

Public DNS names can redirect or resolve to private addresses. URL validation cannot resolve DNS safely in deterministic execution. GenLayer's web service must enforce network isolation on every request and redirect. Do not expose an unrestricted backend URL fetcher.

HTML can contain prompt injection, omissions, deceptive statistics, or forged institutional claims. Prompt instructions reduce attack surface but cannot eliminate these risks. Independent validators can share model/data biases. Approval reflects sufficient support under a methodology, not proof of physical truth.

Published evidence can change between validators and between the two evaluation rounds. Strict enum consensus intentionally reduces liveness. No confidence percentages are assigned. Hashes identify observed text but do not preserve full reports or prove institutional authenticity.

The registry is permissionless and globally capped, making capacity exhaustion possible. This MVP has no stake-based admission control, allowlist, or governance upgrade path. Limits reduce per-entry growth but do not establish abuse resistance.

Local storage is user-editable and stores only a browser transaction reference, never authoritative verdicts or keys. A deployed malicious contract can spoof interface version/schema; interface checks establish compatibility, not an independent source audit. The owner must deploy and verify the supplied source.

No security audit or deployed execution validation is claimed. Before real financial use, require independent review, realistic consensus/adversarial tests, a funding governance policy, and a separately audited escrow design.

## Reporting

Privately report a suspected issue to the repository owner through their established channel. No fabricated security email or service-level commitment is provided.
