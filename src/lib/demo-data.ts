// Demo dataset for "trailgearhub.com", a fictional hiking gear blog.
// Lets users explore the full product without connecting Google or
// configuring OpenRouter.

import type { CrawlResult, GscSnapshot } from "@/lib/types";

const D = "https://trailgearhub.com";

export function getDemoSnapshot(): GscSnapshot {
  const pages = [
    { url: `${D}/best-hiking-boots-2026`, clicks: 1840, impressions: 52400, ctr: 0.0351, position: 6.2, prevClicks: 2710, prevImpressions: 58900 },
    { url: `${D}/ultralight-backpacking-gear-list`, clicks: 1320, impressions: 31200, ctr: 0.0423, position: 4.8, prevClicks: 1295, prevImpressions: 30100 },
    { url: `${D}/best-trekking-poles`, clicks: 980, impressions: 44800, ctr: 0.0219, position: 8.4, prevClicks: 1010, prevImpressions: 42100 },
    { url: `${D}/how-to-break-in-hiking-boots`, clicks: 760, impressions: 12900, ctr: 0.0589, position: 3.1, prevClicks: 1180, prevImpressions: 16800 },
    { url: `${D}/best-rain-jackets-hiking`, clicks: 645, impressions: 38600, ctr: 0.0167, position: 9.7, prevClicks: 612, prevImpressions: 35200 },
    { url: `${D}/merino-wool-vs-synthetic-base-layers`, clicks: 540, impressions: 9800, ctr: 0.0551, position: 5.4, prevClicks: 533, prevImpressions: 9500 },
    { url: `${D}/day-hike-packing-checklist`, clicks: 470, impressions: 21700, ctr: 0.0217, position: 11.3, prevClicks: 689, prevImpressions: 27400 },
    { url: `${D}/best-budget-tents-under-200`, clicks: 410, impressions: 18900, ctr: 0.0217, position: 12.6, prevClicks: 398, prevImpressions: 17800 },
    { url: `${D}/hiking-with-dogs-guide`, clicks: 350, impressions: 8400, ctr: 0.0417, position: 7.2, prevClicks: 341, prevImpressions: 8100 },
    { url: `${D}/water-filters-backpacking`, clicks: 290, impressions: 16200, ctr: 0.0179, position: 13.8, prevClicks: 460, prevImpressions: 19500 },
    { url: `${D}/winter-hiking-layering-guide`, clicks: 230, impressions: 7300, ctr: 0.0315, position: 9.1, prevClicks: 225, prevImpressions: 7000 },
    { url: `${D}/trail-running-shoes-vs-hiking-shoes`, clicks: 185, impressions: 11400, ctr: 0.0162, position: 14.9, prevClicks: 198, prevImpressions: 15300 },
    { url: `${D}/leave-no-trace-principles`, clicks: 95, impressions: 3200, ctr: 0.0297, position: 8.8, prevClicks: 91, prevImpressions: 3050 },
    { url: `${D}/headlamps-for-hiking`, clicks: 60, impressions: 5900, ctr: 0.0102, position: 18.2, prevClicks: 58, prevImpressions: 5400 },
  ].map((p) => ({
    ...p,
    clicksDelta: p.clicks - p.prevClicks,
    impressionsDelta: p.impressions - p.prevImpressions,
  }));

  const queries = [
    { query: "best hiking boots 2026", clicks: 920, impressions: 24100, ctr: 0.0382, position: 5.8, page: `${D}/best-hiking-boots-2026` },
    { query: "ultralight backpacking gear list", clicks: 610, impressions: 11900, ctr: 0.0513, position: 4.2, page: `${D}/ultralight-backpacking-gear-list` },
    { query: "best trekking poles", clicks: 480, impressions: 19800, ctr: 0.0242, position: 7.9, page: `${D}/best-trekking-poles` },
    { query: "trekking poles worth it", clicks: 130, impressions: 6800, ctr: 0.0191, position: 6.4, page: `${D}/best-trekking-poles` },
    { query: "how to break in hiking boots fast", clicks: 410, impressions: 6200, ctr: 0.0661, position: 2.8, page: `${D}/how-to-break-in-hiking-boots` },
    { query: "best rain jacket for hiking", clicks: 340, impressions: 17400, ctr: 0.0195, position: 8.6, page: `${D}/best-rain-jackets-hiking` },
    { query: "lightweight rain jacket backpacking", clicks: 88, impressions: 7900, ctr: 0.0111, position: 11.2, page: `${D}/best-rain-jackets-hiking` },
    { query: "merino wool vs synthetic", clicks: 290, impressions: 5400, ctr: 0.0537, position: 5.1, page: `${D}/merino-wool-vs-synthetic-base-layers` },
    { query: "day hike packing list", clicks: 240, impressions: 10800, ctr: 0.0222, position: 9.8, page: `${D}/day-hike-packing-checklist` },
    { query: "best budget backpacking tent", clicks: 210, impressions: 9600, ctr: 0.0219, position: 11.4, page: `${D}/best-budget-tents-under-200` },
    { query: "tents under 200", clicks: 95, impressions: 4900, ctr: 0.0194, position: 13.1, page: `${D}/best-budget-tents-under-200` },
    { query: "hiking with dogs tips", clicks: 180, impressions: 4100, ctr: 0.0439, position: 6.7, page: `${D}/hiking-with-dogs-guide` },
    { query: "best water filter backpacking", clicks: 150, impressions: 8700, ctr: 0.0172, position: 12.9, page: `${D}/water-filters-backpacking` },
    { query: "winter hiking clothes", clicks: 120, impressions: 3900, ctr: 0.0308, position: 8.3, page: `${D}/winter-hiking-layering-guide` },
    { query: "trail runners vs hiking boots", clicks: 98, impressions: 6100, ctr: 0.0161, position: 13.7, page: `${D}/trail-running-shoes-vs-hiking-shoes` },
    { query: "best headlamp for hiking", clicks: 32, impressions: 3400, ctr: 0.0094, position: 17.6, page: `${D}/headlamps-for-hiking` },
  ];

  const clicks = pages.reduce((s, p) => s + p.clicks, 0);
  const prevClicks = pages.reduce((s, p) => s + p.prevClicks, 0);
  const impressions = pages.reduce((s, p) => s + p.impressions, 0);
  const prevImpressions = pages.reduce((s, p) => s + p.prevImpressions, 0);

  return {
    property: `${D}/`,
    rangeDays: 28,
    summary: {
      clicks,
      impressions,
      ctr: clicks / impressions,
      position: 8.9,
      prevClicks,
      prevImpressions,
      clicksDelta: clicks - prevClicks,
      impressionsDelta: impressions - prevImpressions,
    },
    pages,
    queries,
    fetchedAt: Date.now(),
    demo: true,
  };
}

export function getDemoCrawl(): CrawlResult {
  const pages = [
    { url: `${D}/`, title: "Trail Gear Hub — Honest Hiking Gear Reviews", headings: ["Latest Gear Reviews", "Trail Guides", "Beginner Resources"], internalLinks: [`${D}/best-hiking-boots-2026`, `${D}/ultralight-backpacking-gear-list`, `${D}/best-trekking-poles`, `${D}/best-rain-jackets-hiking`, `${D}/day-hike-packing-checklist`] },
    { url: `${D}/best-hiking-boots-2026`, title: "The 12 Best Hiking Boots of 2026, Trail-Tested", headings: ["Our Top Picks", "Best Overall", "Best Budget Boot", "How We Test", "Sizing and Fit"], internalLinks: [`${D}/how-to-break-in-hiking-boots`, `${D}/merino-wool-vs-synthetic-base-layers`] },
    { url: `${D}/ultralight-backpacking-gear-list`, title: "Ultralight Backpacking Gear List: 9.8 lb Base Weight", headings: ["The Big Three", "Shelter", "Sleep System", "Cooking", "Full Spreadsheet"], internalLinks: [`${D}/best-budget-tents-under-200`, `${D}/water-filters-backpacking`] },
    { url: `${D}/best-trekking-poles`, title: "Best Trekking Poles: 8 Pairs Compared", headings: ["Top Picks", "Carbon vs Aluminum", "Grip Materials", "When to Use Poles"], internalLinks: [`${D}/best-hiking-boots-2026`] },
    { url: `${D}/how-to-break-in-hiking-boots`, title: "How to Break In Hiking Boots Without Blisters", headings: ["Why Boots Need Breaking In", "The 4-Step Method", "Common Mistakes", "Blister Prevention"], internalLinks: [`${D}/best-hiking-boots-2026`] },
    { url: `${D}/best-rain-jackets-hiking`, title: "Best Rain Jackets for Hiking: Tested in Storms", headings: ["Top Picks", "Waterproof Ratings Explained", "Breathability", "Care and Re-Waterproofing"], internalLinks: [`${D}/winter-hiking-layering-guide`] },
    { url: `${D}/merino-wool-vs-synthetic-base-layers`, title: "Merino Wool vs Synthetic Base Layers: Which Wins?", headings: ["Warmth", "Moisture Management", "Odor", "Durability", "Price"], internalLinks: [`${D}/winter-hiking-layering-guide`] },
    { url: `${D}/day-hike-packing-checklist`, title: "Day Hike Packing Checklist (Printable)", headings: ["The Ten Essentials", "Seasonal Additions", "What Not to Bring"], internalLinks: [`${D}/water-filters-backpacking`, `${D}/headlamps-for-hiking`] },
    { url: `${D}/best-budget-tents-under-200`, title: "Best Budget Backpacking Tents Under $200", headings: ["Top Picks", "Weight vs Price", "Setup Comparison"], internalLinks: [`${D}/ultralight-backpacking-gear-list`] },
    { url: `${D}/hiking-with-dogs-guide`, title: "Hiking With Dogs: The Complete Guide", headings: ["Trail Etiquette", "Dog Gear Essentials", "Paw Protection", "Water and Food"], internalLinks: [] },
    { url: `${D}/water-filters-backpacking`, title: "Best Water Filters for Backpacking", headings: ["Squeeze vs Pump vs Gravity", "Top Picks", "Filter Care in Winter"], internalLinks: [`${D}/ultralight-backpacking-gear-list`] },
    { url: `${D}/winter-hiking-layering-guide`, title: "Winter Hiking Layering: A Simple System", headings: ["Base Layer", "Mid Layer", "Shell", "Common Mistakes"], internalLinks: [`${D}/merino-wool-vs-synthetic-base-layers`, `${D}/best-rain-jackets-hiking`] },
    { url: `${D}/trail-running-shoes-vs-hiking-shoes`, title: "Trail Running Shoes vs Hiking Shoes: Honest Comparison", headings: ["Weight", "Support", "Durability", "Which Should You Buy?"], internalLinks: [] },
    { url: `${D}/leave-no-trace-principles`, title: "The 7 Leave No Trace Principles, Explained", headings: ["Plan Ahead", "Travel on Durable Surfaces", "Dispose of Waste Properly"], internalLinks: [] },
    { url: `${D}/headlamps-for-hiking`, title: "Best Headlamps for Hiking and Camping", headings: ["Lumens Explained", "Battery Life", "Top Picks"], internalLinks: [`${D}/day-hike-packing-checklist`] },
  ];

  const inbound = new Map<string, number>();
  for (const p of pages) {
    for (const link of p.internalLinks) {
      inbound.set(link, (inbound.get(link) ?? 0) + 1);
    }
  }

  const crawledPages = pages.map((p) => ({
    ...p,
    ok: true,
    inboundLinks: inbound.get(p.url) ?? 0,
  }));

  const orphanPages = crawledPages
    .filter((p) => p.inboundLinks === 0 && p.url !== `${D}/`)
    .map((p) => p.url);
  const weakPages = crawledPages
    .filter((p) => p.inboundLinks === 1 && p.url !== `${D}/`)
    .map((p) => p.url);

  return {
    sitemapUrl: `${D}/sitemap.xml`,
    origin: D,
    pages: crawledPages,
    orphanPages,
    weakPages,
    suggestions: [
      { sourceUrl: `${D}/best-hiking-boots-2026`, targetUrl: `${D}/trail-running-shoes-vs-hiking-shoes`, anchorText: "trail running shoes vs hiking shoes", reasoning: "Your highest-traffic boot review is the natural place to capture readers deciding between footwear categories. The comparison page is currently an orphan with zero internal links." },
      { sourceUrl: `${D}/day-hike-packing-checklist`, targetUrl: `${D}/hiking-with-dogs-guide`, anchorText: "packing for a hike with your dog", reasoning: "The checklist attracts beginner hikers, many of whom hike with dogs. The dog guide has no inbound internal links despite solid search traffic." },
      { sourceUrl: `${D}/day-hike-packing-checklist`, targetUrl: `${D}/leave-no-trace-principles`, anchorText: "Leave No Trace principles", reasoning: "The 'What Not to Bring' section naturally pairs with Leave No Trace ethics, and the principles page is an orphan." },
      { sourceUrl: `${D}/best-trekking-poles`, targetUrl: `${D}/how-to-break-in-hiking-boots`, anchorText: "break in your hiking boots", reasoning: "Both pages target hikers preparing for long trips; the boot break-in page is losing clicks and needs more internal authority." },
      { sourceUrl: `${D}/ultralight-backpacking-gear-list`, targetUrl: `${D}/headlamps-for-hiking`, anchorText: "lightweight headlamp picks", reasoning: "The gear list mentions lighting in its spreadsheet but never links to the headlamp roundup, which ranks on page 2 and needs link equity." },
    ],
    crawledAt: Date.now(),
    totalUrlsInSitemap: pages.length,
    demo: true,
  };
}
