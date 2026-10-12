import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haliux - Free open-model Roblox builder",
  description: "Haliux is an original free builder for Roblox games using open models. No credits, no lock in.",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
