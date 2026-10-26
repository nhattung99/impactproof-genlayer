import { describe, expect, it, vi } from "vitest";
import { studionet } from "genlayer-js/chains";
import { ensureStudionet, type WalletProvider } from "@/lib/genlayer/wallet";

const chainId = `0x${studionet.id.toString(16)}`;
function wallet(request: ReturnType<typeof vi.fn>): WalletProvider {
  return { request } as unknown as WalletProvider;
}

describe("standard EVM wallet network setup without MetaMask Snaps", () => {
  it("uses no Snaps or switch calls when already on studionet", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_chainId") return chainId;
      throw new Error(`method [${method}] doesn't has corresponding handler`);
    });
    await expect(ensureStudionet(wallet(request))).resolves.toBeUndefined();
    expect(request.mock.calls.map(([args]) => args.method)).toEqual([
      "eth_chainId",
    ]);
  });

  it("switches an existing network and verifies the resulting chain", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce("0x1")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(chainId);
    await ensureStudionet(wallet(request));
    expect(request.mock.calls.map(([args]) => args.method)).toEqual([
      "eth_chainId",
      "wallet_switchEthereumChain",
      "eth_chainId",
    ]);
    expect(request.mock.calls[1][0].params).toEqual([{ chainId }]);
  });

  it.each([
    { code: 4902 },
    { code: -32603, data: { originalError: { code: 4902 } } },
  ])(
    "adds only an explicitly unknown chain using SDK configuration",
    async (error) => {
      const request = vi
        .fn()
        .mockResolvedValueOnce("0x1")
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(chainId);
      await ensureStudionet(wallet(request));
      expect(request.mock.calls[2][0]).toEqual({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId,
            chainName: studionet.name,
            rpcUrls: [...studionet.rpcUrls.default.http],
            nativeCurrency: studionet.nativeCurrency,
            blockExplorerUrls: [studionet.blockExplorers!.default.url],
          },
        ],
      });
      expect(request.mock.calls.map(([args]) => args.method)).not.toContain(
        "wallet_getSnaps",
      );
    },
  );

  it("preserves user rejection without adding a network", async () => {
    const error = { code: 4001, message: "User rejected" };
    const request = vi
      .fn()
      .mockResolvedValueOnce("0x1")
      .mockRejectedValueOnce(error);
    await expect(ensureStudionet(wallet(request))).rejects.toBe(error);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not claim the network switched when the wallet stayed on another chain", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce("0x1")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("0x1");
    await expect(ensureStudionet(wallet(request))).rejects.toThrow(
      "did not switch",
    );
  });
});
