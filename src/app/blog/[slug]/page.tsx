import { notFound } from "next/navigation";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { marked } from "marked";
import type { Metadata } from "next";
import Link from "next/link";

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
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const html = await marked(post.content);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon-512.png" className="w-7 h-7 rounded-lg" alt="SerpDo" />
            <span className="font-bold tracking-tight text-slate-900">SerpDo</span>
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-700">Blog</Link>
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
