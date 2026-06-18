import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-quick-seo.vercel.app";
const GA_ID_RAW = process.env.NEXT_PUBLIC_GA_ID;
// Validate GA4 format (G-XXXXXXXXXX) before injecting into script tag
const GA_ID = GA_ID_RAW && /^G-[A-Z0-9]+$/.test(GA_ID_RAW) ? GA_ID_RAW : null;

export const metadata: Metadata = {
  title: {
    default: "SerpClerk — Your daily SEO action plan, powered by AI",
    template: "%s | SerpClerk",
  },
  description:
    "Connects to your Google Search Console and tells you exactly which SEO task to do today — ranked by traffic impact.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "SerpClerk — Your daily SEO action plan, powered by AI",
    description:
      "Connects to your Google Search Console and tells you exactly which SEO task to do today — ranked by traffic impact.",
    siteName: "SerpClerk",
    images: [{ url: "/serpdo-og-1200x630-chatgpt.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SerpClerk — Your daily SEO action plan, powered by AI",
    description:
      "Connects to your Google Search Console and tells you exactly which SEO task to do today — ranked by traffic impact.",
    images: ["/serpdo-og-1200x630-chatgpt.png"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
      </body>
    </html>
  );
}
