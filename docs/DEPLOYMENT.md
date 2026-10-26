# Manual stable Studio deployment

**The owner performs deployment. No supplied script deploys a contract.**

## What was observed on 26 October 2026

At https://studio.genlayer.com/contracts the interface shows **GenLayer Studio** in the top bar, an account button with GEN balance, **Your Contracts**, default Python examples including `_hello_world.py`, an editor, a play/run button at the top right, and a Logs panel with Leader, Validator, RPC, GenVM, Consensus and Contract filters.

The default `_hello_world.py` template begins:

```python
# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
```

The page states token transfers, contract-to-contract interactions, and gas consumption are not supported in that Studio environment. No deployment was initiated. Do not infer deployment from a successful schema-generation response.

## Owner actions

1. Open https://studio.genlayer.com. Select/confirm the stable **GenLayer Studio / studionet** environment. Do not use `studio-dev`, preview, or public Bradbury testnet.
2. Prepare the account using Studio's account controls. Check its GEN balance and follow the current Studio instructions for funding if needed. No private key or seed phrase needs to be sent to the coding agent.
3. Import `contracts/impact_proof.py` using the import/upload control beside **Your Contracts**, or create a new contract and paste the complete file. Keep both header lines unchanged.
4. Review the code in the editor. Before deployment, schema compilation can be checked from the repository with `node scripts/check-contract.mjs`. This read-only RPC check passed during local development. Recheck if Studio changes.
5. Use the editor's run/play control to inspect the current compilation/deployment panel. Resolve errors before continuing. The precise labels inside this panel were not observed because deployment was intentionally not initiated; follow the current UI, do not assume a separate Compile button exists.
6. **Owner only:** deploy `ImpactProof` with no constructor arguments. Do not enable leader-only execution. Confirm the actual account and stable environment before signing.
7. Wait for Studio's transaction details to show `FINALIZED` and successful execution (`FINISHED_WITH_RETURN`). Pending or accepted alone is insufficient. If execution fails, preserve the error and return it for repair.
8. Copy the actual deployed contract address and deployment transaction hash from the successful record.
9. Return the address, transaction hash, and confirmation that it is stable studionet to the coding agent. Include compiler/runtime errors if any.

## Frontend activation after owner deployment

Set `.env.local`:

```dotenv
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=<actual deployed address>
NEXT_PUBLIC_GENLAYER_NETWORK=studionet
```

Restart development or run `npm run build` and `npm start`. Public Next.js environment variables are embedded at build time.

The frontend verifies address format, deployed source existence, all method signatures, and finalized interface version. It enables writes only after this succeeds. Browser wallet connections use the SDK's studionet chain object. No custom RPC override is needed.

## Integration gate

Use a real project with authorized public evidence. Connect the creator wallet, register, wait for finality, add a milestone, wait, submit evidence, wait, request verification, and wait for the finalized verdict. Inspect the reason, source availability/hashes, limitations, and eligibility. Refresh to confirm persisted state. Check unauthorized actions and a rejected wallet request. Save actual transaction references.

Only after integration validation should the owner authorize public hosting, GitHub publishing, and the Builders submission. There is no automatic Vercel/GitHub deployment workflow in this repository.
