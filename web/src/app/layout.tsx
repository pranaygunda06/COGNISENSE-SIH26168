import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COGNISENSE | Intelligent Dead Reckoning – SIH26168",
  description:
    "Adaptive AI Intelligence for GNSS-Denied Navigation. Smartphone-based GNSS+INS fusion with confidence-aware EKF. Team NIRASYA – SIH 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
