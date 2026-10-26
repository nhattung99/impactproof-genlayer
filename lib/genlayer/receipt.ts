import {
  TransactionStatus,
  transactionsStatusNumberToName,
} from "genlayer-js/types";

type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}
function leaderReceipt(tx: RecordValue): RecordValue {
  const receipts = record(tx.consensus_data).leader_receipt;
  if (!Array.isArray(receipts)) return {};
  // Validator cancellation after quorum is normal; inspect only the current leader.
  return record(
    receipts.filter((value) => record(value).mode === "leader").at(-1),
  );
}
function status(tx: RecordValue): unknown {
  const value = tx.statusName ?? tx.status_name ?? tx.status;
  return typeof value === "number"
    ? transactionsStatusNumberToName[
        String(value) as keyof typeof transactionsStatusNumberToName
      ]
    : value;
}
function outcome(tx: RecordValue): "success" | "failure" | "unknown" {
  const flat =
    tx.txExecutionResultName ??
    tx.tx_execution_result_name ??
    tx.txExecutionResult ??
    tx.tx_execution_result;
  if (flat === "FINISHED_WITH_ERROR" || flat === 2) return "failure";
  if (flat === "FINISHED_WITH_RETURN" || flat === 1) return "success";
  const leader = leaderReceipt(tx);
  const result = record(leader.result);
  const vm = record(leader.genvm_result);
  if (
    leader.execution_result === "ERROR" ||
    leader.execution_result === "FAILURE" ||
    (typeof result.status === "string" && result.status !== "return") ||
    vm.raw_error ||
    vm.error_code
  )
    return "failure";
  if (
    leader.execution_result === "SUCCESS" &&
    (result.status === undefined || result.status === "return")
  )
    return "success";
  return "unknown";
}

/** Requires persisted finality AND explicit execution evidence; missing fields are not failure. */
export function classifyReceipt(
  value: unknown,
): "failed" | "finalized" | "pending" | "consensus" {
  const tx = record(value);
  const current = status(tx);
  if (current === TransactionStatus.CANCELED) return "failed";
  if (current === TransactionStatus.FINALIZED) {
    const execution = outcome(tx);
    return execution === "success"
      ? "finalized"
      : execution === "failure"
        ? "failed"
        : "consensus";
  }
  return current === TransactionStatus.PENDING ? "pending" : "consensus";
}

export function receiptFailureMessage(value: unknown): string {
  const tx = record(value);
  if (status(tx) === TransactionStatus.CANCELED)
    return "Transaction was canceled. No successful write was finalized.";
  const leader = leaderReceipt(tx);
  const vm = record(leader.genvm_result);
  const rawError = record(vm.raw_error);
  const detail = [
    vm.error_description,
    rawError.message,
    vm.stderr,
    leader.error,
    vm.error_code,
  ].find((value) => typeof value === "string" && value.trim());
  return typeof detail === "string"
    ? `Transaction execution failed: ${detail.trim().slice(0, 600)}`
    : "Transaction execution failed. No successful write was finalized.";
}
