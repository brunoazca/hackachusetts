import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google";
import "./globals.css";

// Piper type: Atkinson Hyperlegible Next (everything; bold for headlines) + Atkinson Hyperlegible Mono
// (ids, dates, counts). Built for low-vision readers. Spec: docs/design/foundations/typography.md
const sans = Atkinson_Hyperlegible_Next({ variable: "--font-atkinson", subsets: ["latin", "latin-ext"] });
const mono = Atkinson_Hyperlegible_Mono({ variable: "--font-atkinson-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Piper — rat intelligence for Boston",
  description: "Follow the rats. A live map and audit of rat reports in Boston, Cambridge and Somerville, for rodent inspectors.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="night" className={`${sans.variable} ${mono.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-bg text-fg">{children}</body>
    </html>
  );
}
