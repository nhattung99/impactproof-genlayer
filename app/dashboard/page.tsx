"use client";
import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { useImpact } from "@/components/provider";
import { ProjectExplorer } from "@/components/projects";
import { TransactionStatus } from "@/components/status";
import { Button } from "@/components/ui/button";
export default function Dashboard() {
  const c = useImpact();
  return (
    <div className="wrap page">
      <div className="eyebrow">YOUR IMPACT WORKSPACE</div>
      <div className="section-heading">
        <div>
          <h1>Project dashboard</h1>
          <p className="page-description">
            Manage milestones. Submit evidence. Build accountability.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus size={16} />
            New project
          </Link>
        </Button>
      </div>
      <TransactionStatus tx={c.tx} />
      {c.tx.status === "monitoring_paused" && (
        <Button onClick={c.resume}>Resume transaction monitoring</Button>
      )}
      {c.account ? (
        <>
          <p className="wallet-line">
            Connected wallet <code>{c.account}</code>
          </p>
          <ProjectExplorer walletOnly />
        </>
      ) : (
        <div className="empty">
          <Wallet size={32} />
          <h3>Your workspace starts with a wallet.</h3>
          <p>
            Connect your wallet to find projects you created and sign
            transactions on studionet.
          </p>
          <Button onClick={() => void c.connect()} disabled={c.connecting}>
            Connect wallet
          </Button>
        </div>
      )}
    </div>
  );
}
