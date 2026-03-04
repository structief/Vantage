import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vantage",
  description: "Spec-driven development — visualise, review, and ship.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
