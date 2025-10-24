import type { Metadata } from "next";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { WalletProvider } from "@/contexts/WalletContext";
import { ThemeProvider } from "@/components/ThemeProvider";

// ✅ SEO Metadata + Favicon
export const metadata: Metadata = {
  title: "AlgoMart",
  description: "Decentralized marketplace built on Algorand",
  icons: {
    icon: [{ url: "/favicon.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <WalletProvider>{children}</WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
