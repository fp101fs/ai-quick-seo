// Shared domain types for AI SEO Employee.

// ---------- Google Search Console ----------

export interface GscTokens {
  access_token: string;
  refresh_token?: string;
  /** Unix ms timestamp when the access token expires. */
  expires_at: number;
}

export interface GscProperty {
  siteUrl: string;
  permissionLevel: string;
}

export interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PagePerformance {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  prevClicks: number;
  prevImpressions: number;
  clicksDelta: number;
  impressionsDelta: number;
}

export interface QueryPerformance {
  query: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PerformanceSummary {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  prevClicks: number;
  prevImpressions: number;
  clicksDelta: number;
  impressionsDelta: number;
}

export interface GscSnapshot {
  property: string;
  rangeDays: number;
  summary: PerformanceSummary;
  pages: PagePerformance[];
  queries: QueryPerformance[];
  fetchedAt: number;
  demo?: boolean;
}

// ---------- Opportunities ----------

export type OpportunityType =
  | "declining-clicks"
  | "declining-impressions"
  | "quick-win"
  | "low-ctr";

export type ImpactLevel = "high" | "medium" | "low";

export interface Opportunity {
  id: string;
  type: OpportunityType;
  impact: ImpactLevel;
  page?: string;
  query?: string;
  issue: string;
  whyItMatters: string;
  recommendedAction: string;
  estimatedImpact: string;
  metrics: {
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
    clicksDelta?: number;
    impressionsDelta?: number;
  };
}

// ---------- Sitemap crawl / internal links ----------

export interface CrawledPage {
  url: string;
  ok: boolean;
  title: string;
  headings: string[];
  internalLinks: string[];
  inboundLinks: number;
}

export interface LinkSuggestion {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  reasoning: string;
}

export interface CrawlResult {
  sitemapUrl: string;
  origin: string;
  pages: CrawledPage[];
  orphanPages: string[];
  weakPages: string[];
  suggestions: LinkSuggestion[];
  crawledAt: number;
  totalUrlsInSitemap: number;
  demo?: boolean;
}

// ---------- Content refresh ----------

export interface ContentRefreshResult {
  url: string;
  missingTopics: string[];
  suggestedH2s: string[];
  faq: { question: string; answer: string }[];
  titleTag: { current: string; suggested: string };
  metaDescription: { current: string; suggested: string };
  contentAdditions: string[];
}

// ---------- Page Grader ----------

export type GradeStatus = "great" | "good" | "needs-work" | "missing";
export type GradeFixType = "content-refresh" | "rank-tracking" | "internal-links" | "manual";

export interface GradeCategory {
  id: string;
  name: string;
  emoji: string;
  score: number;
  maxScore: number;
  status: GradeStatus;
  finding: string;
  fix: string | null;
  fixType?: GradeFixType | null;
}

export interface GradeResult {
  url: string;
  totalScore: number;
  categories: GradeCategory[];
}

// ---------- Daily tasks ----------

export interface SeoTask {
  id: string;
  title: string;
  page?: string;
  category: "content" | "links" | "metadata" | "technical";
  impact: number; // 1-10
  difficulty: number; // 1-10
  explanation: string;
}

// ---------- Coach ----------

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ---------- Article Ideas ----------

export type SearchIntent = "informational" | "commercial" | "navigational" | "transactional";

export interface ArticleIdea {
  rank: number;
  title: string;
  targetKeyword: string;
  intent: SearchIntent;
  reasoning: string;
  estimatedOpportunity: "high" | "medium" | "low";
}

export interface ArticleIdeasResult {
  niche: string;
  existingTopics: string[];
  ideas: ArticleIdea[];
  generatedAt: number;
  demo?: boolean;
}

// ---------- Connection state ----------

export interface ConnectionStatus {
  connected: boolean;
  demo: boolean;
  property: string | null;
  googleConfigured: boolean;
}
