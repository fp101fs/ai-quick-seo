import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://serpdo.com";
const GA_ID_RAW = process.env.NEXT_PUBLIC_GA_ID;
// Validate GA4 format (G-XXXXXXXXXX) before injecting into script tag
const GA_ID = GA_ID_RAW && /^G-[A-Z0-9]+$/.test(GA_ID_RAW) ? GA_ID_RAW : null;

export const metadata: Metadata = {
  title: {
    default: "SerpDo — Your daily SEO action plan, powered by AI",
    template: "%s | SerpDo",
  },
  description:
    "Connects to your Google Search Console and tells you exactly which SEO task to do today — ranked by traffic impact.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "SerpDo — Your daily SEO action plan, powered by AI",
    description:
      "Connects to your Google Search Console and tells you exactly which SEO task to do today — ranked by traffic impact.",
    siteName: "SerpDo",
    images: [{ url: "/serpdo-og-1200x630-bnw.png", width: 1200, height: 630, alt: "SerpDo — AI-powered SEO dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@serpdo",
    creator: "@serpdo",
    title: "SerpDo — Your daily SEO action plan, powered by AI",
    description:
      "Connects to your Google Search Console and tells you exactly which SEO task to do today — ranked by traffic impact.",
    images: [{ url: "/serpdo-og-1200x630-bnw.png", alt: "SerpDo — AI-powered SEO dashboard" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Analytics />
          {GA_ID && (
            <>
              <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              />
              <Script
                id="gtag-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_ID}');
                  `,
                }}
              />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
