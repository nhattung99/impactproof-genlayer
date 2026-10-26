# API research and compatibility decisions

Research date: 26 October 2026 (Asia/Saigon).

Sources consulted:

- https://sdk.genlayer.com/main/_static/ai/api.txt (snapshot in `references/sdk-api.txt`)
- https://docs.genlayer.com/full-documentation.txt (snapshot in `references/full-documentation.txt`)
- Live https://studio.genlayer.com/contracts default `_hello_world.py` template
- Installed `genlayer-js@1.1.8` declarations and implementation
- Official `genlayer-test@0.29.2` and `genvm-linter@0.11.0`
- Extracted stable v0.2.16 SDK source from the official GenVM release runner archive

The repository was initially empty. No `00-read-me.md`, `01-how-to-score.md`, `02-common-errors.md`, or AGENTS.md constraints were present.

## Version discrepancy resolved

The latest SDK reference describes v0.3.0 release-candidate APIs (`import genlayer as gl`, `gl.storage`, `gl.message.raw`) and a newer runner hash. Stable hosted Studio actually reports GenVM v0.2.16 and uses `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`.

The implementation therefore uses the stable runner, explicit `from genlayer import gl, TreeMap, u32`, `gl.message_raw["datetime"]`, `gl.nondet.*`, and `gl.eq_principle.*`. This stable SDK's chain-time API was verified through official direct tests. No application calls `run_nondet_unsafe` or relies on the changed v0.3 `run_nondet` name.

The installed stable JavaScript SDK requires `writeContract({value:0n,...})`, exposes `getContractSchema(address)` and `getContractCode(address)`, and reports `statusName` and `txExecutionResultName`. Newer documentation's `waitUntil` / `isSuccessful` examples do not match this stable installed version. The adapter polls `getTransaction` and checks the actual stable enum fields. No signatures, RPC endpoint, or chain ID were invented.

Read-only `getContractSchemaForCode` succeeded against stable Studio, returning the expected ten public methods and an empty constructor. This verifies schema compilation, not deployment or all runtime execution paths.
