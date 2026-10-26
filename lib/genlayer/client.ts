import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ensureStudionet, type WalletProvider } from "./wallet";
import {
  TransactionHashVariant,
  TransactionStatus,
  ExecutionResult,
  type GenLayerTransaction,
  type ContractSchema,
  type CalldataEncodable,
  type TransactionHash,
} from "genlayer-js/types";
export type { WalletProvider } from "./wallet";
export const address =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS?.trim();
export const network = process.env.NEXT_PUBLIC_GENLAYER_NETWORK || "studionet";
export const reader = createClient({ chain: studionet });
export { studionet };
export function configError() {
  if (network !== "studionet") return "Only GenLayer studionet is supported.";
  if (!address)
    return "Contract configuration pending. The owner must deploy through GenLayer Studio.";
  if (!/^0x[0-9a-fA-F]{40}$/.test(address) || /^0x0{40}$/.test(address))
    return "The configured contract address is invalid.";
  return null;
}
export function contractAddress(): `0x${string}` {
  const error = configError();
  if (error) throw new Error(error);
  return address as `0x${string}`;
}
const methods: Record<
  string,
  { params: string[]; readonly: boolean; ret: string }
> = {
  interface_version: { params: [], readonly: true, ret: "string" },
  create_project: { params: ["string"], readonly: false, ret: "string" },
  add_milestone: {
    params: ["string", "string"],
    readonly: false,
    ret: "string",
  },
  submit_evidence: {
    params: ["string", "string"],
    readonly: false,
    ret: "null",
  },
  verify_milestone: { params: ["string"], readonly: false, ret: "null" },
  get_project: { params: ["string"], readonly: true, ret: "string" },
  list_projects: { params: ["int", "int"], readonly: true, ret: "string" },
  get_milestone: { params: ["string"], readonly: true, ret: "string" },
  get_evidence: { params: ["string"], readonly: true, ret: "string" },
  get_verdict: { params: ["string"], readonly: true, ret: "string" },
};
export function checkSchema(schema: ContractSchema) {
  for (const [name, expected] of Object.entries(methods)) {
    const m = schema.methods[name];
    if (
      !m ||
      m.readonly !== expected.readonly ||
      m.ret !== expected.ret ||
      m.params.length !== expected.params.length ||
      m.params.some((p, i) => p[1] !== expected.params[i]) ||
      Object.keys(m.kwparams).length
    )
      throw new Error(`Incompatible contract interface: ${name}`);
  }
}
export async function validateDeployment() {
  const a = contractAddress();
  const [code, schema] = await Promise.all([
    reader.getContractCode(a),
    reader.getContractSchema(a),
  ]);
  if (!code?.trim()) throw new Error("No contract code at configured address");
  checkSchema(schema);
  const version = await reader.readContract({
    address: a,
    functionName: "interface_version",
    args: [],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  if (version !== "impactproof/1")
    throw new Error("Unsupported ImpactProof contract version");
}
export async function read<T>(
  functionName: string,
  args: CalldataEncodable[] = [],
): Promise<T> {
  const raw = await reader.readContract({
    address: contractAddress(),
    functionName,
    args,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  if (typeof raw !== "string") throw new Error("Unexpected contract response");
  return JSON.parse(raw) as T;
}
export function classifyReceipt(
  tx: GenLayerTransaction,
): "failed" | "finalized" | "pending" | "consensus" {
  if (
    tx.statusName === TransactionStatus.CANCELED ||
    tx.txExecutionResultName === ExecutionResult.FINISHED_WITH_ERROR
  )
    return "failed";
  if (tx.statusName === TransactionStatus.FINALIZED)
    return tx.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN
      ? "finalized"
      : "failed";
  return tx.statusName === TransactionStatus.PENDING ? "pending" : "consensus";
}
export function errorMessage(error: unknown) {
  const e = error as { code?: number; message?: string };
  return e?.code === 4001
    ? "Wallet request rejected. No success has been recorded."
    : e?.message?.slice(0, 500) ||
        "The request failed. Check the wallet and RPC connection.";
}
export async function submit(
  provider: WalletProvider,
  account: `0x${string}`,
  functionName: string,
  args: CalldataEncodable[],
) {
  await ensureStudionet(provider);
  const accounts = await provider.request({ method: "eth_accounts" });
  if (
    !Array.isArray(accounts) ||
    String(accounts[0]).toLowerCase() !== account.toLowerCase()
  )
    throw new Error("Wallet account changed. Reconnect before signing.");
  const client = createClient({ chain: studionet, account, provider });
  const hash: unknown = await client.writeContract({
    address: contractAddress(),
    functionName,
    args,
    value: 0n,
  });
  if (typeof hash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hash))
    throw new Error("SDK did not return a valid transaction hash");
  return hash as TransactionHash;
}
