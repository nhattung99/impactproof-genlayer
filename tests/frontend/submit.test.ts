import { beforeEach, describe, expect, it, vi } from "vitest";
import { studionet } from "genlayer-js/chains";
import type { WalletProvider } from "@/lib/genlayer/wallet";

const mocks = vi.hoisted(() => ({ writeContract: vi.fn(), connect: vi.fn() }));
vi.mock("genlayer-js", () => ({ createClient: vi.fn(() => mocks) }));

describe("SDK submission without the Snaps-only connect helper", () => {
  const account = "0x1111111111111111111111111111111111111111" as const;
  const hash = `0x${"a".repeat(64)}`;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv(
      "NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS",
      "0xCea7D28DB1FBBAC0797C0F3c1B7b4c5f614EAD6e",
    );
  });

  it("reaches official SDK writeContract even when wallet_getSnaps has no handler", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_chainId") return `0x${studionet.id.toString(16)}`;
      if (method === "eth_accounts") return [account];
      throw new Error(`method [${method}] doesn't has corresponding handler`);
    });
    mocks.writeContract.mockResolvedValue(hash);
    const { submit } = await import("@/lib/genlayer/client");
    expect(
      await submit(
        { request } as unknown as WalletProvider,
        account,
        "create_project",
        ["{}"],
      ),
    ).toBe(hash);
    expect(mocks.connect).not.toHaveBeenCalled();
    expect(mocks.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "create_project", value: 0n }),
    );
    expect(request.mock.calls.map(([args]) => args.method)).toEqual([
      "eth_chainId",
      "eth_accounts",
    ]);
  });

  it("does not submit if the wallet account changed", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(`0x${studionet.id.toString(16)}`)
      .mockResolvedValueOnce(["0x2222222222222222222222222222222222222222"]);
    const { submit } = await import("@/lib/genlayer/client");
    await expect(
      submit(
        { request } as unknown as WalletProvider,
        account,
        "create_project",
        ["{}"],
      ),
    ).rejects.toThrow("account changed");
    expect(mocks.writeContract).not.toHaveBeenCalled();
  });
});
