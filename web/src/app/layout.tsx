import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next, Bodoni_Moda } from "next/font/google";
import "./globals.css";

// Piper type: Bodoni Moda (one headline per panel), Atkinson Hyperlegible Next (UI + body),
// Atkinson Hyperlegible Mono (records). Spec: docs/design/foundations/typography.md
const display = Bodoni_Moda({ variable: "--font-bodoni", subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"] });
const sans = Atkinson_Hyperlegible_Next({ variable: "--font-atkinson", subsets: ["latin", "latin-ext"] });
const mono = Atkinson_Hyperlegible_Mono({ variable: "--font-atkinson-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Piper — rat intelligence for Boston",
  description: "Follow the rats. A live map and audit of rat reports in Boston, Cambridge and Somerville, for rodent inspectors.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="night" className={`${display.variable} ${sans.variable} ${mono.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-bg text-fg">{children}</body>
    </html>
  );
}
