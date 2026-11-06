import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASTER | Multi-Hazard Intelligence",
  description: "A research workspace for multi-hazard risk prediction, graph-based relief planning and resilient emergency communication.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
