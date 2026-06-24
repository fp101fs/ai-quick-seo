---
title: "SEO for a Website: How to Set It Up Right From the Start"
slug: seo-for-website
description: "The complete setup guide for SEO on a new or existing website — covering the technical foundation, Google Search Console, on-page basics, and what to do in your first 90 days."
keywords: [seo for website, website seo setup, how to do seo for a website, seo setup guide, new website seo]
publishedAt: ""
---

# SEO for a Website: How to Set It Up Right From the Start

## Introduction
- Most websites get SEO wrong in the first 30 days — they skip the foundation and jump to content
- Broken foundations cap how high you can rank, no matter how good your content is
- This guide covers exactly what to set up, in the right order, for a website starting SEO from scratch

---

## Phase 1: Technical Foundation (Day 1–7)

Do this before publishing content. A page can't rank if it can't be crawled.

### HTTPS
- Mandatory. Google won't rank HTTP pages for competitive queries.
- Confirm: your URL starts with `https://` and shows a padlock
- Redirect: all HTTP → HTTPS, www → non-www (or vice versa, pick one consistently)

### robots.txt
- Lives at `yourdomain.com/robots.txt`
- Default for most sites: `User-agent: * Allow: /`
- Block: admin pages, login pages, checkout, search results, duplicate content
- Never accidentally block your own content

### XML Sitemap
- Lists all pages you want Google to index
- Lives at `yourdomain.com/sitemap.xml`
- Most CMS platforms (WordPress, Squarespace, Webflow) generate this automatically
- Submit to Google Search Console after setting up (Step 2)

### URL structure
- Decide now — changing URLs later breaks rankings and links
- Pattern: `yourdomain.com/category/page-title` or `yourdomain.com/page-title`
- Rules: short, readable, keyword-included, hyphens not underscores

### Page speed
- Target: LCP < 2.5 seconds
- Check: Google PageSpeed Insights
- Quick wins: compress images, use a CDN, minimize JavaScript

---

## Phase 2: Google Search Console Setup (Day 1–3)

GSC is free, essential, and takes 10 minutes to set up.

### Setup steps
1. Go to search.google.com/search-console
2. Add property → Enter your domain
3. Verify ownership (DNS record is easiest; HTML file upload also works)
4. Submit your sitemap: Settings → Sitemaps → paste `yourdomain.com/sitemap.xml`
5. Wait 24–72 hours for data to start appearing

### What to check after setup
- **Coverage** tab: are your pages indexed? Any errors?
- **Core Web Vitals** tab: any speed issues Google has flagged?
- **Enhancements** tab: any structured data errors?

Note: a new site won't have ranking data for weeks. Set this up now so data accumulates.

---

## Phase 3: On-Page Basics (Day 1–30, Ongoing)

Every page you publish needs these elements correctly set.

### Title tags
- Format: `Primary Keyword — Modifier | Brand`
- Example: `Best Running Shoes for Flat Feet — 2025 Picks | ShoeSite`
- Max 60 characters
- Every page needs a unique title

### Meta descriptions
- Summarize the page and invite the click
- Max 155 characters
- Not a direct ranking factor, but bad metas kill CTR

### H1 (main headline)
- One per page
- Contains the primary keyword
- Different from the title tag — add one extra angle

### H2 / H3 subheadings
- Organize content logically
- Mirror the sub-questions people have about the topic
- Keyword-relevant, not keyword-stuffed

### Image alt text
- Every image needs descriptive alt text
- Helps accessibility + Google Image search + page relevance signals
- Bad: `img_2034.jpg` / Good: `woman-running-shoes-flat-feet.jpg`

---

## Phase 4: Content Strategy (Day 30–90)

With the foundation set, now publish content that can actually rank.

### Choose your keyword targets
- Start with GSC data (once it has 30+ days): what queries do you already appear for?
- Look for position 11–20 — you're close, and fixes have fast payoff
- For a new site: start with long-tail, low-competition keywords (3–5 words, specific)

### One page = one primary keyword cluster
- Don't target the same keyword on multiple pages (keyword cannibalization)
- Map out which page targets which keyword before publishing

### Content that earns rankings
- Answers the full search intent, not just the keyword
- Longer than the minimum needed — not padding, just complete
- FAQ section targeting related "people also ask" queries
- Internal links to and from relevant existing pages

### Internal linking from day one
- Every new page should be linked from at least one existing page
- Your homepage should link to your most important category/landing pages
- Never publish a page with zero internal links pointing to it (orphan page)

---

## Phase 5: First 90 Days Expectations

### Month 1
- Technical foundation live
- GSC data accumulating
- Core pages published with correct on-page optimization

### Month 2
- GSC starting to show query data
- Identify first set of optimization opportunities
- Fix any indexing errors surfaced in GSC Coverage tab

### Month 3
- First ranking movements visible (usually long-tail keywords)
- Expand content on performing pages
- Start building first backlinks (directory listings, community mentions)

**Realistic expectation:** most new sites see meaningful organic traffic in month 4–6. Sites with existing domain authority move faster.

---

## Common Setup Mistakes

- Launching without submitting sitemap to GSC
- Using a WordPress SEO plugin but leaving all fields blank
- Targeting the same keyword on 3 different pages
- No internal linking structure (every page is an island)
- Publishing thin content (< 300 words) hoping to rank competitively
- Ignoring mobile — Google indexes mobile-first

---

## Quick-Reference Checklist

**Technical**
- [ ] HTTPS active
- [ ] robots.txt correct
- [ ] XML sitemap submitted to GSC
- [ ] URL structure decided and consistent
- [ ] PageSpeed Insights score checked

**On-Page (per page)**
- [ ] Unique title tag with keyword, under 60 chars
- [ ] Meta description under 155 chars
- [ ] One H1 with primary keyword
- [ ] H2s covering subtopics
- [ ] Image alt text on all images
- [ ] At least 2 internal links to/from this page

**Content**
- [ ] Answers the full search intent
- [ ] FAQ section
- [ ] No duplicate content

---

## FAQ

**Should I do SEO myself or hire someone?**
Start yourself — GSC data is free and the basics aren't complicated. Hire when you can't keep up with the content production, not before.

**Does my website platform matter for SEO?**
Somewhat. WordPress, Webflow, and Next.js give you full control. Wix and Squarespace have improved but still have some technical limits. The platform matters less than your content and links.

**How soon will my new website rank?**
A brand new domain with no authority typically needs 4–8 months before ranking competitively. It can be shorter for very specific, low-competition long-tail keywords.

**CTA:** Once your site is live and GSC is connected, SerpDo automatically surfaces your highest-impact fixes from your real search data. [Get your first task →](/dashboard)
