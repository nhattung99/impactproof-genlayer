# Validation record and test guide

## Published deployment verification

The owner supplied the stable studionet address `0xCea7D28DB1FBBAC0797C0F3c1B7b4c5f614EAD6e`. The read-only `scripts/verify-deployment.mjs` check confirmed matching source (normalized line endings), ten matching public method signatures, finalized `impactproof/1`, and an empty first page of projects. No wallet-signed write was performed by the coding agent.

The configured production build, 24 frontend tests, and ESLint passed again before publication. Vercel completed its production build successfully. Public `curl -I https://impactproof-genlayer.vercel.app` returned `200 OK`; the first 4,000 HTML characters contain `ImpactProof` and `<div id="root">`. GitHub repository: https://github.com/nhattung99/impactproof-genlayer (public).

The live explorer was also checked in the browser: it displays **Studionet contract verified**, reads the empty finalized registry, and offers project registration without simulated records. The earlier test record below describes predeployment validation; its real-wallet and multi-validator testing limits still apply.

Validated locally on 26 October 2026. No deployment or network write was performed.

| Check                                                                            | Result                                           | Scope                                                                                                                  |
| -------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Dependency install / npm audit                                                   | Passed; zero reported vulnerabilities at install | Locked JS dependencies                                                                                                 |
| `npm run typecheck`                                                              | Passed                                           | Strict TypeScript application and test specs                                                                           |
| `npm run lint`                                                                   | Passed                                           | ESLint / Next / React rules                                                                                            |
| `npm test`                                                                       | 24 tests                                         | Validation, receipt classification, real adapter read path with RPC test double, UI states, navigation toggle          |
| `npm run test:contract`                                                          | 16 passed                                        | Host-Python contract logic, explicit test doubles                                                                      |
| `.venv/Scripts/python -m pytest tests/direct -v`                                 | 7 passed                                         | Official GenLayer SDK in-memory storage, access control, verification persistence; external evidence/LLM inputs mocked |
| `genvm-lint check contracts/impact_proof.py --json` with `GENVM_VERSION=v0.2.16` | Passed                                           | AST safety + real SDK schema/storage validation, 10 public methods                                                     |
| `node scripts/check-contract.mjs`                                                | Passed against stable Studio RPC                 | Read-only schema compilation; no deploy/sign                                                                           |
| `npm run build`                                                                  | Passed with webpack                              | All eight requested routes compile                                                                                     |
| Browser desktop preview                                                          | Passed                                           | Landing visual review, explorer empty/config state, registration fields and disabled writes                            |
| Mobile browser layout                                                            | Not verified                                     | Browser viewport override did not change the actual host viewport; responsive CSS and nav-toggle unit test exist       |
| Playwright CLI smoke specs                                                       | Prepared, not executed                           | Desktop/mobile public routes and responsive navigation                                                                 |
| Real-wallet integration spec                                                     | Prepared, not executed                           | Requires owner-deployed contract, real project/evidence, interactive wallet                                            |
| Live multi-validator decisions and finalized writes                              | Not executed                                     | Owner deployment boundary                                                                                              |

## Commands

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run test:contract
npm run build
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt
.venv/Scripts/python -m pytest tests/direct -v
$env:GENVM_VERSION='v0.2.16'
.venv/Scripts/genvm-lint check contracts/impact_proof.py --json
node scripts/check-contract.mjs
```

Official tooling may download a runner archive into the user's cache. Direct tests instantiate the contract in memory; they do not deploy to any blockchain. Run them separately from the host-Python suite because that suite deliberately installs SDK doubles in `sys.modules`.

`tests/direct/conftest.py` supplies a narrow Windows compatibility fix for genlayer-test 0.29.2: its loader unlinks a file while stdin still holds it open, which Windows forbids. Cleanup is deferred until the VM restores stdin. No production SDK file or contract behavior is patched.

## Coverage and limits

Host logic tests cover registration, malformed fields/targets/dates, authorization, milestone creation, negative allocation, evidence integrity and duplicates, URL restrictions, unavailable evidence, all three decisions, contradictory/insufficient input fixtures, exact decision mismatch, duplicate finalization, missing evidence, malformed model output, and storage bounds. Mock decisions test code paths, not the model's ability to judge real reports.

Official direct tests use actual runner SDK storage and public method wrappers. Nondeterministic inputs are mocked only in tests. Direct mode does not establish validator voting, WASM isolation, appeals, fee requirements, closure serialization across the GenVM boundary, or production liveness. Studio schema generation verifies actual contract loading/schema compilation but not constructor/write execution on-chain.

## Browser smoke specs

Start the app on port 3001 (`npm run start -- --port 3001` after building). With Playwright browsers installed, run `npm run test:e2e -- smoke.spec.ts`. `IMPACTPROOF_BASE_URL` can override the base URL. These specs assume blank contract configuration and include mobile navigation. They were prepared but not run during this session; desktop inspection used the connected browser.

## Owner-assisted real integration

The opt-in `deployed.integration.spec.ts` does not deploy contracts. It opens a dedicated Chrome wallet profile. Use a separate profile made for this project; do not point to a running everyday Chrome profile. Human approval of each wallet request is required. No seed phrase or private key is read by test code.

After manual deployment/configuration, provide a private local JSON fixture with `project`, `milestone`, and `evidence` objects matching README schemas. Use a real authorized project with a unique name and actual public evidence; do not commit private fixtures. Then:

```powershell
$env:IMPACTPROOF_INTEGRATION='1'
$env:IMPACTPROOF_WALLET_PROFILE='<dedicated Chrome profile directory>'
$env:IMPACTPROOF_REAL_PROJECT_FILE='<absolute fixture JSON path>'
$env:IMPACTPROOF_BASE_URL='http://127.0.0.1:3001'
npm run test:e2e -- deployed.integration.spec.ts --project=desktop --headed
```

Keep the wallet visible to approve connection and each real transaction. The spec waits for finality after registration, milestone creation, and evidence submission, then requests verification and checks verdict persistence after refresh. A long-running consensus may pause monitoring; resume through the dashboard rather than double-submit. Do not claim this integration test passed until it executes with actual receipts.

## Host issues resolved

Turbopack failed to launch its CSS compiler worker on this Windows host even outside the sandbox. The supported webpack build succeeded and is the default script. Sandboxed Vitest temporary-file renames failed with EPERM; running with normal Windows temp access succeeded. These were tooling/host issues, not evidence of deployed correctness.
