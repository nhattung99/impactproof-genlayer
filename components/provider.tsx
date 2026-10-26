"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CalldataEncodable, TransactionHash } from "genlayer-js/types";
import {
  address,
  configError,
  validateDeployment,
  errorMessage,
  studionet,
  submit,
  reader,
  classifyReceipt,
  type WalletProvider,
} from "@/lib/genlayer/client";
import type { TxState } from "@/types/impact";
import { ensureStudionet } from "@/lib/genlayer/wallet";
type Context = {
  account?: `0x${string}`;
  wrongNetwork: boolean;
  connecting: boolean;
  walletError?: string;
  ready: boolean;
  checking: boolean;
  configMessage: string;
  revision: number;
  tx: TxState;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => void;
  write: (method: string, args: CalldataEncodable[]) => Promise<void>;
  resume: () => void;
};
const ImpactContext = createContext<Context | null>(null);
type Injected = WalletProvider & {
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    callback: (...args: unknown[]) => void,
  ) => void;
};
function provider() {
  return (window as unknown as { ethereum?: Injected }).ethereum;
}
export function ImpactProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<`0x${string}`>();
  const [wrongNetwork, setWrong] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string>();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(!configError());
  const [configMessage, setMessage] = useState(
    configError() || "Checking deployed contract…",
  );
  const [revision, setRevision] = useState(0);
  const [tx, setTx] = useState<TxState>({ status: "idle" });
  const lock = useRef(false);
  const generation = useRef(0);
  const refresh = useCallback(() => setRevision((v) => v + 1), []);
  useEffect(() => {
    if (configError()) return;
    let active = true;
    validateDeployment()
      .then(() => {
        if (active) {
          setReady(true);
          setMessage("Connected to verified ImpactProof contract");
        }
      })
      .catch((e) => {
        if (active) {
          setReady(false);
          setMessage(errorMessage(e));
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  useEffect(() => {
    const p = provider();
    if (!p) return;
    const accounts = (...args: unknown[]) => {
      const a = args[0];
      setAccount(
        Array.isArray(a) && typeof a[0] === "string"
          ? (a[0] as `0x${string}`)
          : undefined,
      );
    };
    const chain = (...args: unknown[]) =>
      setWrong(Number(args[0]) !== studionet.id);
    p.on?.("accountsChanged", accounts);
    p.on?.("chainChanged", chain);
    return () => {
      p.removeListener?.("accountsChanged", accounts);
      p.removeListener?.("chainChanged", chain);
    };
  }, []);
  const monitor = useCallback(
    async (state: TxState) => {
      if (!state.hash || state.contract !== address) return;
      const token = ++generation.current;
      lock.current = true;
      try {
        for (let i = 0; i < 120; i++) {
          if (token !== generation.current) return;
          const receipt = await reader.getTransaction({
            hash: state.hash as TransactionHash,
          });
          const status = classifyReceipt(receipt);
          setTx({
            ...state,
            status,
            message:
              status === "finalized"
                ? "Transaction finalized with successful execution."
                : status === "failed"
                  ? "Transaction failed or was canceled. No approval recorded."
                  : "Waiting for persisted GenLayer consensus and finality…",
          });
          if (status === "failed" || status === "finalized") {
            if (status === "finalized") refresh();
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        setTx({
          ...state,
          status: "monitoring_paused",
          message:
            "Monitoring paused after 10 minutes. The transaction may still be pending. Resume to check; do not submit again.",
        });
      } catch (e) {
        setTx({
          ...state,
          status: "monitoring_paused",
          message: `Monitoring interrupted: ${errorMessage(e)} Resume using the same transaction hash.`,
        });
      } finally {
        lock.current = false;
      }
    },
    [refresh],
  );
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`impactproof:tx:${address}`);
      if (stored) {
        const parsed = JSON.parse(stored) as TxState;
        if (
          parsed.hash &&
          /^0x[0-9a-fA-F]{64}$/.test(parsed.hash) &&
          parsed.contract === address
        )
          queueMicrotask(() =>
            setTx({
              ...parsed,
              status:
                parsed.status === "finalized" || parsed.status === "failed"
                  ? parsed.status
                  : "monitoring_paused",
            }),
          );
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (tx.hash)
      localStorage.setItem(`impactproof:tx:${address}`, JSON.stringify(tx));
  }, [tx]);
  async function connect() {
    setConnecting(true);
    setWalletError(undefined);
    try {
      const p = provider();
      if (!p)
        throw new Error(
          "Install a supported EVM wallet such as MetaMask to connect.",
        );
      const accounts = await p.request({ method: "eth_requestAccounts" });
      if (!Array.isArray(accounts) || typeof accounts[0] !== "string")
        throw new Error("No wallet account returned");
      const chain = await p.request({ method: "eth_chainId" });
      setWrong(Number(chain) !== studionet.id);
      await ensureStudionet(p);
      setWrong(false);
      const currentAccounts = await p.request({ method: "eth_accounts" });
      if (
        !Array.isArray(currentAccounts) ||
        typeof currentAccounts[0] !== "string"
      )
        throw new Error("No wallet account returned");
      setAccount(currentAccounts[0] as `0x${string}`);
    } catch (e) {
      setAccount(undefined);
      setWalletError(errorMessage(e));
    } finally {
      setConnecting(false);
    }
  }
  async function write(method: string, args: CalldataEncodable[]) {
    if (
      lock.current ||
      ["signing", "pending", "consensus", "monitoring_paused"].includes(
        tx.status,
      )
    )
      return;
    lock.current = true;
    try {
      if (!ready || !account || wrongNetwork)
        throw new Error(
          "Connect a wallet on studionet and validate the deployed contract first.",
        );
      const p = provider();
      if (!p) throw new Error("Wallet unavailable");
      const liveAccounts = await p.request({ method: "eth_accounts" });
      if (
        !Array.isArray(liveAccounts) ||
        String(liveAccounts[0]).toLowerCase() !== account.toLowerCase()
      )
        throw new Error("Wallet account changed. Reconnect before signing.");
      if (Number(await p.request({ method: "eth_chainId" })) !== studionet.id)
        throw new Error("Wrong network. Reconnect to studionet.");
      setTx({
        status: "signing",
        method,
        message: "Confirm the real transaction in your wallet.",
      });
      const hash = await submit(p, account, method, args);
      const state: TxState = {
        hash,
        method,
        contract: address,
        status: "pending",
        message: "Submitted. Waiting for consensus; this is not finalized.",
      };
      setTx(state);
      await monitor(state);
    } catch (e) {
      setTx({ status: "failed", method, message: errorMessage(e) });
    } finally {
      lock.current = false;
    }
  }
  return (
    <ImpactContext.Provider
      value={{
        account,
        wrongNetwork,
        connecting,
        walletError,
        ready,
        checking,
        configMessage,
        revision,
        tx,
        connect,
        disconnect: () => setAccount(undefined),
        refresh,
        write,
        resume: () => {
          void monitor(tx);
        },
      }}
    >
      {children}
    </ImpactContext.Provider>
  );
}
export function useImpact() {
  const c = useContext(ImpactContext);
  if (!c) throw new Error("ImpactProvider missing");
  return c;
}
