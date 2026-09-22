import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

/**
 * UX4G Design System typography foundation: Noto Sans
 * Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
 * Source: https://ux4g.gov.in/foundations/typography
 */
const notoSans = Noto_Sans({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: "METRA — Metrology Enforcement & Traceability Regulatory Assistant",
  description: "AI-powered legal metrology compliance, inspection and traceability assistant.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/sign-in"
    >
      <html lang="en" className={notoSans.variable}>
        <body className={`${notoSans.className} antialiased min-h-screen`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
