"use client";

import { useState, useRef } from "react";

import {
  Search,
  Download,
  Loader2,
  Globe,
  TrendingUp,
  BookOpen,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { AiLoading } from "@/components/ai-loading";
import { analyzeCompetitor, suggestCompetitors } from "@/app/actions/analyze";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface CompetitorReport {
  siteName: string;
  summary: string;
  keywords: string[];
  contentGaps: { topic: string; description: string }[];
  suggestedBlogTitles: string[];
  seoStrategy: string;
}

export default function CompetitorPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CompetitorReport | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const { competitors, debug } = await suggestCompetitors();
      console.log("[suggest-competitors]", debug);
      setSuggestions(competitors);
      if (!competitors.length) toast.info("No suggestions found — try entering a competitor manually.");
    } catch (err) {
      console.error("[suggest-competitors] client error", err);
      toast.error(err instanceof Error ? err.message : "Could not suggest competitors");
    } finally {
      setSuggesting(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    setLoading(true);
    setReport(null);
    try {
      const data = await analyzeCompetitor(url);
      setReport(data);
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current || !report) return;

    toast.info("Generating PDF...");
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`SEO-Report-${report.siteName.replace(/\s+/g, "-")}.pdf`);
    toast.success("PDF exported!");
  };

  return (
    <div>
      <PageHeader
        title="Competitor Spy"
        description="Decode a competitor's SEO strategy: keywords, content gaps, and quick-win blog ideas."
        help="Enter any competitor URL. The AI reads their site content, extracts the keywords they're targeting, identifies gaps you could exploit, and suggests specific blog titles to outrank them."
      />

      <form onSubmit={handleAnalyze} className="relative max-w-2xl mb-8">
        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          type="url"
          placeholder="https://competitor.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="pl-12 pr-32 h-13 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
          required
        />
        <Button
          type="submit"
          disabled={loading}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing
            </>
          ) : (
            <>
              <Search className="w-4 h-4" /> Analyze
            </>
          )}
        </Button>
      </form>

      {/* Suggest competitors */}
      {!report && !loading && (
        <div className="mb-8 space-y-3">
          <Button
            variant="outline"
            onClick={handleSuggest}
            disabled={suggesting}
            className="border-slate-200 dark:border-slate-700"
          >
            {suggesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Suggest competitors from my niche
          </Button>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setUrl(s)}
                  className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors font-mono"
                >
                  {s.replace(/^https?:\/\//, "")}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm">
          <AiLoading message="Analyzing competitor site…" size="lg" className="py-20" />
        </div>
      )}

      {report && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{report.siteName} Report</h2>
              <p className="text-slate-500 text-sm">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
            <Button variant="outline" onClick={exportToPDF} className="border-slate-200">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>

          <div
            ref={reportRef}
            className="space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold uppercase tracking-wider text-slate-500 text-sm">
                  Overview
                </h3>
              </div>
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">{report.summary}</p>
            </section>

            <hr className="border-slate-100 dark:border-slate-700" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">
                    Target Keywords
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 px-3 py-1 text-sm font-medium"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">
                    SEO Strategy
                  </h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic">
                  {report.seoStrategy}
                </p>
              </section>
            </div>

            <hr className="border-slate-100 dark:border-slate-700" />

            <section>
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">
                  Content Opportunities (Gaps)
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {report.contentGaps.map((gap, i) => (
                  <Card key={i} className="bg-slate-50 dark:bg-slate-900/50 border-none shadow-none ring-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-slate-900 dark:text-slate-100">{gap.topic}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{gap.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-6">
                <Search className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">
                  Quick-Win Blog Titles
                </h3>
              </div>
              <ul className="space-y-3">
                {report.suggestedBlogTitles.map((title, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 group">
                    <span className="flex-none w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="group-hover:text-indigo-600 transition-colors cursor-default">
                      {title}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      {!report && !loading && (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-300 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">No Analysis Yet</h3>
          <p className="text-slate-500">
            Enter a competitor&apos;s URL above to start dissecting their strategy.
          </p>
        </div>
      )}
    </div>
  );
}
