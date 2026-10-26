// Read-only Studio schema generation. Never deploys or signs a transaction.
import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
const code = await readFile(
  new URL("../contracts/impact_proof.py", import.meta.url),
  "utf8",
);
const client = createClient({ chain: studionet });
const schema = await client.getContractSchemaForCode(code);
console.log(JSON.stringify(schema, null, 2));
