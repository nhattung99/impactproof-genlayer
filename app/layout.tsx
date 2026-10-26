import type { Metadata } from "next";
import "./globals.css";
import { ImpactProvider } from "@/components/provider";
import { Header, Footer } from "@/components/shell";
export const metadata: Metadata = {
  title: {
    default: "ImpactProof — Verifiable Real-World Impact",
    template: "%s | ImpactProof",
  },
  description:
    "Real impact. Verifiable decisions. Accountable funding. Evidence-based impact verification powered by GenLayer.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div id="root">
          <ImpactProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </ImpactProvider>
        </div>
      </body>
    </html>
  );
}
