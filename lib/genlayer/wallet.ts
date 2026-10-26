import type { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export type WalletProvider = NonNullable<
  NonNullable<Parameters<typeof createClient>[0]>["provider"]
>;

function errorCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const value = error as {
    code?: number;
    data?: { originalError?: { code?: number } };
  };
  return value.code === 4902 || value.data?.originalError?.code === 4902
    ? 4902
    : value.code;
}

/** Use standard wallet network RPCs; SDK connect() also requires MetaMask Snaps. */
export async function ensureStudionet(provider: WalletProvider): Promise<void> {
  const chainId = `0x${studionet.id.toString(16)}`;
  if (
    Number(await provider.request({ method: "eth_chainId" })) === studionet.id
  )
    return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  } catch (error) {
    // Only an explicitly unknown chain permits adding it. Never swallow rejection.
    if (errorCode(error) !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId,
          chainName: studionet.name,
          rpcUrls: [...studionet.rpcUrls.default.http],
          nativeCurrency: studionet.nativeCurrency,
          ...(studionet.blockExplorers?.default.url
            ? { blockExplorerUrls: [studionet.blockExplorers.default.url] }
            : {}),
        },
      ],
    });
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  }

  if (
    Number(await provider.request({ method: "eth_chainId" })) !== studionet.id
  )
    throw new Error(
      "The wallet did not switch to GenLayer studionet. Select studionet in your wallet and reconnect.",
    );
}
