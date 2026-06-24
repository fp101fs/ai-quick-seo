import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — SEO tips powered by real data",
  description: "Practical guides on AI SEO, GEO (Generative Engine Optimization), and using AI tools to grow your organic traffic.",
};

const CONTENT_DIR = join(process.cwd(), "content");

function getPosts() {
  try {
    return readdirSync(CONTENT_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => {
        const raw = readFileSync(join(CONTENT_DIR, f), "utf8");
        const { data } = matter(raw);
        return {
          slug: f.replace(".md", ""),
          title: (data as { title?: string }).title ?? f,
          description: (data as { description?: string }).description ?? "",
        };
      });
  } catch {
    return [];
  }
}

export default function BlogIndex() {
  const posts = getPosts();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon-512.png" className="w-7 h-7 rounded-lg" alt="SerpDo" />
            <span className="font-bold tracking-tight text-slate-900">SerpDo</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-500">Blog</span>
          <Link
            href="/dashboard"
            className="ml-auto text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-full transition-colors"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Blog</h1>
        <p className="text-slate-500 mb-10">Practical guides on AI SEO, GEO, and growing organic traffic with real data.</p>

        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block bg-white rounded-2xl ring-1 ring-slate-200 p-6 hover:ring-indigo-300 hover:shadow-sm transition-all"
              >
                <h2 className="font-semibold text-slate-900 mb-1.5 leading-snug">{post.title}</h2>
                <p className="text-sm text-slate-500 leading-relaxed">{post.description}</p>
                <span className="inline-block mt-3 text-xs font-semibold text-indigo-600">Read →</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <footer className="text-center py-10 border-t border-slate-200 mt-12">
        <p className="text-slate-400 text-sm">
          <Link href="/" className="hover:text-slate-600">SerpDo</Link>
          {" · "}
          <Link href="/pricing" className="hover:text-slate-600">Pricing</Link>
        </p>
      </footer>
    </div>
  );
}
