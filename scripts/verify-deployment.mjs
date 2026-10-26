// Read-only validation of an owner-deployed contract. Never deploys or signs.
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
const address = process.argv[2];
if (!/^0x[0-9a-fA-F]{40}$/.test(address || '') || /^0x0{40}$/.test(address)) throw new Error('Provide a valid nonzero contract address');
const client = createClient({ chain: studionet });
const [code, schema, local] = await Promise.all([
  client.getContractCode(address), client.getContractSchema(address),
  readFile(new URL('../contracts/impact_proof.py', import.meta.url), 'utf8'),
]);
if (!code?.trim()) throw new Error('No deployed source found');
const expected = await client.getContractSchemaForCode(local);
for (const [name, method] of Object.entries(expected.methods)) {
  const actual = schema.methods[name];
  if (!actual || actual.readonly !== method.readonly || actual.ret !== method.ret || JSON.stringify(actual.params) !== JSON.stringify(method.params) || JSON.stringify(actual.kwparams) !== JSON.stringify(method.kwparams)) throw new Error(`Incompatible deployed method: ${name}`);
}
const options = { address, transactionHashVariant: TransactionHashVariant.LATEST_FINAL };
const version = await client.readContract({ ...options, functionName: 'interface_version', args: [] });
if (version !== 'impactproof/1') throw new Error(`Unsupported deployed interface: ${String(version)}`);
const projects = JSON.parse(await client.readContract({ ...options, functionName: 'list_projects', args: [0, 50] }));
if (!Array.isArray(projects)) throw new Error('Unexpected project list response');
console.log(JSON.stringify({ address, network: 'studionet', interfaceVersion: version, publicMethods: Object.keys(schema.methods), sourceSha256: createHash('sha256').update(code).digest('hex'), sourceMatchesLocal: code.replaceAll('\r\n','\n').trim() === local.replaceAll('\r\n','\n').trim(), finalizedProjectsOnFirstPage: projects.length }, null, 2));
