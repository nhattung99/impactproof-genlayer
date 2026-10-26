import { describe, expect, it } from "vitest";
import fixture from "../fixtures/studio-create-project-finalized.json";
import { classifyReceipt, receiptFailureMessage } from "@/lib/genlayer/receipt";

describe("actual Studio receipt schema", () => {
  it("recognizes the reported transaction as finalized success without flat execution fields", () => {
    expect(classifyReceipt(fixture)).toBe("finalized");
  });
  it("supports the raw numeric persisted status", () => {
    expect(classifyReceipt({ ...fixture, statusName: undefined })).toBe(
      "finalized",
    );
  });
  it("never infers success or failure from finality and majority agreement alone", () => {
    expect(
      classifyReceipt({
        statusName: "FINALIZED",
        result_name: "MAJORITY_AGREE",
      }),
    ).toBe("consensus");
  });
  it("does not treat a provisional execution error as terminal before consensus finalizes", () => {
    expect(
      classifyReceipt({
        statusName: "PROPOSING",
        txExecutionResultName: "FINISHED_WITH_ERROR",
      }),
    ).toBe("consensus");
  });
  it("does not use validator cancellation as a failed leader execution", () => {
    expect(
      classifyReceipt({
        statusName: "FINALIZED",
        consensus_data: {
          leader_receipt: [
            {
              mode: "validator",
              execution_result: "ERROR",
              genvm_result: {
                error_code: "CONSENSUS_VALIDATOR_QUORUM_REACHED",
              },
            },
          ],
        },
      }),
    ).toBe("consensus");
  });
  it("reports actual finalized Studio execution errors and their reasons", () => {
    const failed = {
      statusName: "FINALIZED",
      consensus_data: {
        leader_receipt: [
          {
            mode: "leader",
            execution_result: "ERROR",
            genvm_result: { error_description: "Creator only" },
          },
        ],
      },
    };
    expect(classifyReceipt(failed)).toBe("failed");
    expect(receiptFailureMessage(failed)).toContain("Creator only");
  });
  it("rejects explicit leader VM errors even when its execution flag says success", () => {
    expect(
      classifyReceipt({
        statusName: "FINALIZED",
        consensus_data: {
          leader_receipt: [
            {
              mode: "leader",
              execution_result: "SUCCESS",
              genvm_result: { error_code: "VM_ERROR" },
            },
          ],
        },
      }),
    ).toBe("failed");
  });
  it("handles cancellation explicitly", () => {
    expect(classifyReceipt({ statusName: "CANCELED" })).toBe("failed");
    expect(receiptFailureMessage({ statusName: "CANCELED" })).toContain(
      "canceled",
    );
  });
});
