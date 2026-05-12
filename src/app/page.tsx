"use client";

import { useState, useRef } from "react";
import { Search, Download, Loader2, Globe, TrendingUp, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { analyzeCompetitor } from "./actions/analyze";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function SEOAnalyzer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

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
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster />
      
      {/* Hero Section */}
      <header className="bg-white border-b border-slate-200 py-12 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-3 py-1">
            SEO Insight Engine v1.0
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
            Decode Your <span className="text-indigo-600">Competitors</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Enter a competitor's URL to extract keywords, identify content gaps, and get 
            actionable blog ideas in seconds.
          </p>
          
          <form onSubmit={handleAnalyze} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="url"
                placeholder="https://competitor.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-12 pr-32 h-14 text-lg rounded-full border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                required
              />
              <Button 
                type="submit" 
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 px-6 font-medium transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-4">
        {loading && (
          <div className="space-y-8">
            <Skeleton className="h-40 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        )}

        {report && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{report.siteName} Report</h2>
                <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
              </div>
              <Button variant="outline" onClick={exportToPDF} className="border-slate-200">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>

            <div ref={reportRef} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              {/* Summary Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-xl uppercase tracking-wider text-slate-500 text-sm">Overview</h3>
                </div>
                <p className="text-lg leading-relaxed text-slate-700">
                  {report.summary}
                </p>
              </section>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Keywords */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Target Keywords</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.keywords.map((kw: string) => (
                      <Badge key={kw} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 text-sm font-medium">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </section>

                {/* Strategy */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">SEO Strategy</h3>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed italic">
                    {report.seoStrategy}
                  </p>
                </section>
              </div>

              <hr className="border-slate-100" />

              {/* Content Gaps */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Content Opportunities (Gaps)</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {report.contentGaps.map((gap: any, i: number) => (
                    <Card key={i} className="bg-slate-50 border-none shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-900">{gap.topic}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600">{gap.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Suggested Blog Titles */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Search className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Quick-Win Blog Titles</h3>
                </div>
                <ul className="space-y-3">
                  {report.suggestedBlogTitles.map((title: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 group">
                      <span className="flex-none w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
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
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No Analysis Yet</h3>
            <p className="text-slate-500">Enter a URL above to start dissecting your competition.</p>
          </div>
        )}
      </main>
      
      <footer className="text-center py-12 border-t border-slate-200 mt-12">
        <p className="text-slate-400 text-sm">
          Built with Next.js 15 + Claude 3.5 Sonnet
        </p>
      </footer>
    </div>
  );
}
