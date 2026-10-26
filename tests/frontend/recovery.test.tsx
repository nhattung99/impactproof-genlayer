import React from "react";
import { expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import fixture from "../fixtures/studio-create-project-finalized.json";
import { ImpactProvider, useImpact } from "@/components/provider";
const mocks = vi.hoisted(() => ({ getTransaction: vi.fn() }));
vi.mock("@/lib/genlayer/client", async () => {
  const { classifyReceipt, receiptFailureMessage } =
    await import("@/lib/genlayer/receipt");
  return {
    address: "0xCea7D28DB1FBBAC0797C0F3c1B7b4c5f614EAD6e",
    configError: () => null,
    validateDeployment: vi.fn().mockResolvedValue(undefined),
    errorMessage: String,
    studionet: { id: 61999 },
    submit: vi.fn(),
    reader: mocks,
    classifyReceipt,
    receiptFailureMessage,
  };
});
function SavedTransaction() {
  const { tx } = useImpact();
  return (
    <div data-testid="recovered">
      {tx.status}: {tx.message}
    </div>
  );
}
it("rechecks a saved false failure and replaces it with the actual finalized result", async () => {
  const contract = "0xCea7D28DB1FBBAC0797C0F3c1B7b4c5f614EAD6e";
  localStorage.setItem(
    `impactproof:tx:${contract}`,
    JSON.stringify({
      hash: fixture.hash,
      contract,
      method: "create_project",
      status: "failed",
      message: "Transaction failed or was canceled. No approval recorded.",
    }),
  );
  mocks.getTransaction.mockResolvedValue(fixture);
  render(
    <ImpactProvider>
      <SavedTransaction />
    </ImpactProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId("recovered")).toHaveTextContent(
      "finalized: Transaction finalized with successful execution.",
    ),
  );
  expect(mocks.getTransaction).toHaveBeenCalledWith({ hash: fixture.hash });
  expect(
    JSON.parse(localStorage.getItem(`impactproof:tx:${contract}`)!).status,
  ).toBe("finalized");
  localStorage.clear();
});
