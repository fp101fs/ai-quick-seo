import { notFound } from "next/navigation";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { marked } from "marked";
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://serpdo.com";

// Slug → which app feature to promote inline
const FEATURE_LINKS: Record<string, { label: string; href: string; cta: string }> = {
  "seo-checker":     { label: "Page Grader", href: "/page-grader", cta: "Grade your page free →" },
  "seo-101":         { label: "SEO Opportunities", href: "/opportunities", cta: "See your opportunities →" },
  "ai-seo":         { label: "AI Coach", href: "/coach", cta: "Ask your AI SEO coach →" },
  "seo-for-ai":     { label: "Page Grader", href: "/page-grader", cta: "Check your GEO score →" },
  "seo-geo":        { label: "Page Grader", href: "/page-grader", cta: "Check your GEO score →" },
  "seo-geo-aeo":    { label: "Page Grader", href: "/page-grader", cta: "Check your GEO score →" },
  "seo-tools":      { label: "Dashboard", href: "/dashboard", cta: "Try SerpDo free →" },
  "seo-marketing":  { label: "Opportunities", href: "/opportunities", cta: "Find your top opportunity →" },
  "seo-optimization":{ label: "Page Grader", href: "/page-grader", cta: "Grade a page now →" },
  "seo-questions":  { label: "AI Coach", href: "/coach", cta: "Ask your AI SEO coach →" },
  "seo-for-website":{ label: "Internal Links", href: "/internal-links", cta: "Find orphan pages →" },
  "seo-website":    { label: "Content Refresh", href: "/content-refresh", cta: "Refresh your content →" },
};

const CONTENT_DIR = join(process.cwd(), "content");

function getPost(slug: string) {
  try {
    const raw = readFileSync(join(CONTENT_DIR, `${slug}.md`), "utf8");
    const { data, content } = matter(raw);
    return { frontmatter: data as { title: string; description: string; keywords?: string[] }, content };
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    return readdirSync(CONTENT_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({ slug: f.replace(".md", "") }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const { frontmatter } = post;
  return {
    title: frontmatter.title,
    description: frontmatter.description,
    keywords: frontmatter.keywords,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const html = await marked(post.content);
  const feature = FEATURE_LINKS[slug] ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    url: `${SITE_URL}/blog/${slug}`,
    publisher: { "@type": "Organization", name: "SerpDo", url: SITE_URL },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon-512.png" className="w-7 h-7 rounded-lg" alt="SerpDo" />
            <span className="font-bold tracking-tight text-slate-900">SerpDo</span>
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-700">Blog</Link>
          <Link
            href="/dashboard"
            className="ml-auto text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-full transition-colors"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <article
          className="prose prose-slate prose-lg max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-3xl prose-h1:mb-6
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-base prose-h3:mt-6
            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
            prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
            prose-pre:bg-slate-900 prose-pre:text-slate-100
            prose-table:text-sm
            prose-th:bg-slate-50 prose-th:font-semibold
            prose-blockquote:border-indigo-400 prose-blockquote:text-slate-600"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {feature && (
          <div className="mt-12 rounded-xl border border-indigo-100 bg-indigo-50 px-6 py-5 flex items-center justify-between gap-4">
            <p className="text-sm text-indigo-800 font-medium">Try it in SerpDo: <span className="font-semibold">{feature.label}</span></p>
            <Link
              href={feature.href}
              className="shrink-0 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-full transition-colors"
            >
              {feature.cta}
            </Link>
          </div>
        )}

        <div className="mt-16 rounded-2xl bg-indigo-600 text-white px-8 py-8 text-center">
          <p className="font-bold text-lg mb-2">Put this into practice</p>
          <p className="text-indigo-100 text-sm mb-5">
            SerpDo connects your Google Search Console data to AI — so every task is ranked by your actual traffic impact.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold text-sm px-6 py-3 rounded-full hover:bg-indigo-50 transition-colors"
          >
            See today&apos;s top task →
          </Link>
        </div>
      </main>

      <footer className="text-center py-10 border-t border-slate-200 mt-12">
        <p className="text-slate-400 text-sm">
          <Link href="/" className="hover:text-slate-600">SerpDo</Link>
          {" · "}
          <Link href="/blog" className="hover:text-slate-600">Blog</Link>
          {" · "}
          <Link href="/pricing" className="hover:text-slate-600">Pricing</Link>
        </p>
      </footer>
    </div>
  );
}
