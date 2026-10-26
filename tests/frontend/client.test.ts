import { describe, it, expect, vi } from "vitest";
import {
  classifyReceipt,
  errorMessage,
  configError,
  checkSchema,
} from "@/lib/genlayer/client";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
describe("truthful transaction state", () => {
  it("never treats accepted as finalized", () =>
    expect(
      classifyReceipt({
        statusName: TransactionStatus.ACCEPTED,
        txExecutionResultName: ExecutionResult.FINISHED_WITH_RETURN,
      }),
    ).toBe("consensus"));
  it("keeps submitted transactions pending", () =>
    expect(classifyReceipt({ statusName: TransactionStatus.PENDING })).toBe(
      "pending",
    ));
  it("requires successful execution as well as finality", () => {
    expect(
      classifyReceipt({
        statusName: TransactionStatus.FINALIZED,
        txExecutionResultName: ExecutionResult.FINISHED_WITH_RETURN,
      }),
    ).toBe("finalized");
    expect(
      classifyReceipt({
        statusName: TransactionStatus.FINALIZED,
        txExecutionResultName: ExecutionResult.FINISHED_WITH_ERROR,
      }),
    ).toBe("failed");
    expect(classifyReceipt({ statusName: TransactionStatus.FINALIZED })).toBe(
      "consensus",
    );
  });
  it("handles wallet rejection", () =>
    expect(errorMessage({ code: 4001 })).toContain("rejected"));
  it("disables missing configuration and rejects mismatched interfaces", () => {
    expect(configError()).toContain("pending");
    expect(() =>
      checkSchema({ ctor: { params: [], kwparams: {} }, methods: {} }),
    ).toThrow("interface_version");
  });
  it("reads JSON from finalized state after explicit configuration", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS",
      "0x1111111111111111111111111111111111111111",
    );
    vi.resetModules();
    const clientModule = await import("@/lib/genlayer/client");
    const spy = vi
      .spyOn(clientModule.reader, "readContract")
      .mockResolvedValue(JSON.stringify({ name: "Recorded project" }));
    expect(await clientModule.read("get_project", ["1"])).toEqual({
      name: "Recorded project",
    });
    expect(spy.mock.calls[0][0].transactionHashVariant).toBe("latest-final");
    spy.mockRestore();
    vi.unstubAllEnvs();
  });
});
