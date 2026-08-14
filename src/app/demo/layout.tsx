/**
 * Root layout for the /demo route group.
 * Deliberately avoids Clerk / Supabase providers so the demo works
 * without any backend credentials. The demo uses mock data throughout.
 */

import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "FoloUp — Enhanced UI suite",
  description: "Demo of the create-interview wizard, feedback dashboard, anti-cheat, and video interview features.",
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
