import type { TxState } from "@/types/impact";
export function Status({ value }: { value: string }) {
  return (
    <span className={`badge badge-${value.toLowerCase()}`}>
      <span />
      {value.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}
export function TransactionStatus({ tx }: { tx: TxState }) {
  if (tx.status === "idle") return null;
  return (
    <div className="notice" role="status" aria-live="polite">
      <Status value={tx.status} />
      <p>{tx.message}</p>
      {tx.hash && <code className="hash">Transaction: {tx.hash}</code>}
    </div>
  );
}
