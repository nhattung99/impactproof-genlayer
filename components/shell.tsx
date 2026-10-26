"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  ShieldCheck,
  Menu,
  X,
  Wallet,
  Leaf,
  ExternalLink,
} from "lucide-react";
import { useImpact } from "./provider";
import { Button } from "./ui/button";
import { short } from "@/lib/utils";
export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="ImpactProof home">
      <span className="logo-icon">
        <Leaf size={22} />
      </span>
      Impact<span>Proof</span>
    </Link>
  );
}
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const c = useImpact();
  return (
    <>
      <header className="header">
        <div className="nav-container">
          <Logo />
          <nav
            aria-label="Main navigation"
            className={open ? "nav open" : "nav"}
          >
            {[
              ["/explore", "Explore projects"],
              ["/verify", "Verification"],
              ["/about", "How it works"],
              ["/dashboard", "Dashboard"],
            ].map(([href, label]) => (
              <Link
                onClick={() => setOpen(false)}
                className={pathname === href ? "active" : ""}
                key={href}
                href={href}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <span className="network">
              <i />
              Studionet
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (c.account) c.disconnect();
                else void c.connect();
              }}
              disabled={c.connecting}
            >
              <Wallet size={15} />
              {c.connecting
                ? "Connecting…"
                : c.account
                  ? short(c.account)
                  : "Connect wallet"}
            </Button>
            <button
              className="menu-button"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      {(c.walletError || c.wrongNetwork) && (
        <div className="wallet-alert" role="alert">
          {c.walletError ||
            "Wrong network. Connect your wallet to GenLayer studionet."}
          {c.wrongNetwork && (
            <button onClick={() => void c.connect()}>Switch network</button>
          )}
        </div>
      )}
    </>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div>
        <Logo />
        <p>Real impact. Verifiable decisions. Accountable funding.</p>
      </div>
      <div className="footer-links">
        <Link href="/about">Architecture</Link>
        <a href="https://studio.genlayer.com" target="_blank" rel="noreferrer">
          GenLayer Studio <ExternalLink size={12} />
        </a>
        <span>
          <ShieldCheck size={14} />
          Powered by GenLayer
        </span>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ImpactProof</span>
        <span>
          Built for a more accountable world <ArrowUpRight size={12} />
        </span>
      </div>
    </footer>
  );
}
