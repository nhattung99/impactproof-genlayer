import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/shell";
import { TransactionStatus, Status } from "@/components/status";
import { Empty, ProjectExplorer } from "@/components/projects";
import Dashboard from "@/app/dashboard/page";
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/components/provider", () => ({
  useImpact: () => ({
    ready: false,
    checking: false,
    configMessage: "Contract configuration pending",
    revision: 0,
    account: undefined,
    tx: { status: "idle" },
    refresh: vi.fn(),
    connect: vi.fn(),
  }),
}));
describe("public states", () => {
  it("opens and closes responsive navigation accessibly", () => {
    render(<Header />);
    const menu = screen.getByRole("button", { name: "Open navigation" });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menu);
    expect(
      screen.getByRole("button", { name: "Close navigation" }),
    ).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(
      screen.getByRole("link", { name: "Verification" }),
    );
    expect(
      screen.getByRole("button", { name: "Open navigation" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
  it("renders pending, failed, and needs-review explicitly", () => {
    const { rerender } = render(
      <TransactionStatus
        tx={{ status: "pending", message: "Waiting for consensus" }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("pending");
    rerender(
      <TransactionStatus tx={{ status: "failed", message: "RPC failure" }} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("failed");
    rerender(<Status value="NEEDS_REVIEW" />);
    expect(screen.getByText("needs review")).toBeInTheDocument();
  });
  it("shows a useful empty list", () => {
    render(<Empty />);
    expect(
      screen.getByRole("link", { name: /Register a project/i }),
    ).toHaveAttribute("href", "/projects/new");
  });
  it("shows configuration pending without fake projects", () => {
    render(<ProjectExplorer />);
    expect(
      screen.getByText("Awaiting contract deployment"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No project or verification data is simulated/),
    ).toBeInTheDocument();
  });
  it("asks disconnected users to connect", () => {
    render(<Dashboard />);
    expect(
      screen.getByRole("button", { name: "Connect wallet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your workspace starts with a wallet."),
    ).toBeInTheDocument();
  });
});
