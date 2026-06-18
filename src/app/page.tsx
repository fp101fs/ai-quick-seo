import Link from "next/link";
import {
  ArrowRight,
  Target,
  Link2,
  RefreshCw,
  MessageSquare,
  ListChecks,
  Search,
  Crown,
  Sparkles,
  Gauge,
  Lightbulb,
  Quote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Target,
    title: "SEO Opportunities",
    description:
      "Connects to Google Search Console and finds pages losing clicks, queries stuck on page 2, and snippets nobody clicks.",
  },
  {
    icon: ListChecks,
    title: "Daily Task List",
    description:
      "Every day, a prioritized plan: what to fix, why it matters, and the expected traffic impact — highest impact first.",
  },
  {
    icon: Link2,
    title: "Internal Link Finder",
    description:
      "Crawls your sitemap, finds orphan pages, and suggests exactly where to link from, with ready-to-use anchor text.",
  },
  {
    icon: RefreshCw,
    title: "Content Refresh",
    description:
      "AI drafts better titles, meta descriptions, new H2 sections, and FAQs for any page — informed by its real search data.",
  },
  {
    icon: MessageSquare,
    title: "AI Coach",
    description:
      "Ask why traffic dropped or what to work on first. The coach answers with your actual pages, queries, and numbers.",
  },
  {
    icon: Search,
    title: "Competitor Spy",
    description:
      "Point it at any competitor to extract their target keywords, content gaps, and quick-win blog ideas.",
  },
  {
    icon: Lightbulb,
    title: "Article Ideas",
    description:
      "Finds keyword gaps your site isn't covering and generates ready-to-publish article titles ranked by traffic opportunity.",
  },
];

const testimonials = [
  {
    name: "Marcus Webb",
    role: "Founder, TravelHacks.io",
    initials: "MW",
    quote:
      "I went from spending Sunday nights guessing what to write to having a prioritized list ready Monday morning. Traffic up 31% in six weeks.",
  },
  {
    name: "Priya Sharma",
    role: "Content Strategist",
    initials: "PS",
    quote:
      "The internal link finder surfaced 47 missing connections on a client site. Would have taken me a full day manually.",
  },
  {
    name: "Tom Auclair",
    role: "SaaS Founder",
    initials: "TA",
    quote:
      "Finally an SEO tool that doesn't make me feel dumb. It reads my actual data and tells me exactly what to fix — in plain English.",
  },
];

const faqs = [
  {
    q: "Is my Google Search Console data safe?",
    a: "Yes. SerpDo connects via read-only OAuth — we can see your performance data but cannot make any changes to your site or property settings. Raw page content is never stored.",
  },
  {
    q: "What AI model does this use?",
    a: "SerpDo routes through OpenRouter to high-quality models (DeepSeek V4 Flash by default). Your data is used only to generate your suggestions and is never used to train AI models.",
  },
  {
    q: "Do I need to know SEO?",
    a: "No. Every task comes with a plain-English explanation of why it matters and exactly what to do. SerpDo is built for founders and creators, not SEO specialists.",
  },
  {
    q: "How long until I see results?",
    a: "Most users see measurable changes within 4–8 weeks of working the daily task list consistently. SEO compounds — the earlier you start, the faster it builds.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Nav */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon-512.png" className="w-8 h-8 rounded-lg" alt="SerpDo" />
            <span className="font-bold tracking-tight">SerpDo</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Pricing
            </Link>
            <a
              href="/api/auth/google"
              className="flex items-center gap-2 text-sm font-medium text-slate-700 border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50 px-4 py-2 rounded-full transition-colors"
            >
              Sign in
            </a>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-5"
              render={<Link href="/dashboard" />}
              nativeButton={false}
            >
              Open dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 sm:py-28 px-4 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_oklch(0.93_0.04_280),_transparent_60%)]"
          aria-hidden
        />
        <div className="max-w-3xl mx-auto">
          <Badge className="mb-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-3 py-1">
            <Sparkles className="w-3 h-3" />
            Powered by your real Search Console data
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Know exactly what to fix.
            <br className="hidden sm:block" />{" "}
            <span className="text-indigo-600">Every single day.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto">
            SerpDo reads your Google Search Console data and tells you the one SEO action
            that will move the needle most — then helps you execute it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-8 h-12 text-base"
              render={<Link href="/dashboard" />}
              nativeButton={false}
            >
              <Crown className="w-4 h-4" />
              See today&apos;s top task
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 h-12 text-base border-slate-200 bg-white"
              render={<a href="/api/auth/google" />}
              nativeButton={false}
            >
              <ArrowRight className="w-4 h-4" />
              Connect Search Console
            </Button>
          </div>
          <p className="text-sm text-slate-400 mt-6">
            Free to start. No credit card. Try it with demo data in seconds.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Six tools. One daily plan.
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Your real Search Console data — turned into specific, ranked actions.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 hover:ring-indigo-200 hover:shadow-md transition-all"
            >
              <span className="flex w-10 h-10 items-center justify-center rounded-xl bg-indigo-50 mb-4">
                <feature.icon className="w-5 h-5 text-indigo-600" />
              </span>
              <h3 className="font-semibold text-slate-900 mb-1.5">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-10">
            Loved by builders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-slate-50 rounded-2xl p-6 ring-1 ring-slate-200 flex flex-col gap-4"
              >
                <Quote className="w-5 h-5 text-indigo-300 shrink-0" />
                <p className="text-slate-700 text-sm leading-relaxed flex-1">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <span className="flex w-9 h-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-12">
            Three steps to your daily plan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Connect",
                description: "Link Google Search Console (read-only) and pick a property — or start with demo data.",
              },
              {
                step: "2",
                title: "Analyze",
                description: "SerpDo imports your performance data, crawls your sitemap, and surfaces what's hurting your traffic.",
              },
              {
                step: "3",
                title: "Execute",
                description: "Work the prioritized list. Each task includes the why, the how, and the expected impact.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold mb-4">
                  {item.step}
                </span>
                <h3 className="font-semibold text-slate-900 mb-1.5">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Gauge className="w-10 h-10 text-indigo-600 mx-auto mb-5" />
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Stop guessing. Start executing.
          </h2>
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-8 h-12 text-base"
            render={<Link href="/dashboard" />}
            nativeButton={false}
          >
            Open your dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-10">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-semibold text-slate-900 hover:bg-slate-50 transition-colors">
                {faq.q}
                <span className="shrink-0 text-slate-400 group-open:rotate-45 transition-transform duration-200">
                  +
                </span>
              </summary>
              <p className="px-6 pb-5 text-slate-500 text-sm leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="text-center py-10 border-t border-slate-200">
        <p className="text-slate-400 text-sm mb-3">
          SerpDo — powered by Google Search Console + OpenRouter
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link href="/pricing" className="text-slate-400 hover:text-slate-600 transition-colors">
            Pricing
          </Link>
          <Link href="/privacy" className="text-slate-400 hover:text-slate-600 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-slate-400 hover:text-slate-600 transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
