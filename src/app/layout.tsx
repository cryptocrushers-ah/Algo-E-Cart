import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { Navbar } from "@/components/navigation/navbar";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import { WalletProvider } from "@/lib/wallet/WalletContext";

export const metadata: Metadata = {
  title: "Algo-E-Cart - Decentralized Escrow Marketplace",
  description:
    "A decentralized marketplace powered by Algorand blockchain with secure escrow transactions.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        {/* 🧱 Error Boundary */}
        <ErrorReporter />

        {/* 🔗 Route Messenger (optional external script) */}
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "Algo-E-Cart", "version": "1.0.0"}'
        />

        {/* 🌐 Global Wallet Context — wraps everything */}
        <WalletProvider>
          <div className="flex flex-col min-h-screen">
            {/* 🧭 Navbar is global */}
            <Navbar />

            {/* 🧩 Page content */}
            <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
          </div>
        </WalletProvider>

        {/* 🪄 Visual Edits Messenger (Dev tool) */}
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
