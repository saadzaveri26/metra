import type { Metadata } from "next";
import { Outfit, Noto_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

/**
 * Primary display font: Outfit — modern geometric sans with character.
 * Noto Sans kept as fallback for Devanagari and extended Unicode support.
 */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-outfit",
});

const notoSans = Noto_Sans({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: "METRA — Metrology Enforcement & Traceability Regulatory Assistant",
  description:
    "AI-powered legal metrology compliance, inspection and traceability assistant for India's packaged commodities enforcement network.",
  openGraph: {
    title: "METRA — Metrology Enforcement & Traceability Regulatory Assistant",
    description:
      "Scan packaged commodities, verify compliance against Legal Metrology Rules 2011, and maintain inspection traceability.",
    type: "website",
  },
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
      <html lang="en" className={`${outfit.variable} ${notoSans.variable}`}>
        <body className={`${outfit.className} antialiased min-h-screen`}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[#0867c9] focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold"
          >
            Skip to content
          </a>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
