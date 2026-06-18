import { sql } from "@vercel/postgres";

export { sql };

// ---------- Schema ----------

export async function runMigrations() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      picture TEXT,
      stripe_customer_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      stripe_subscription_id TEXT UNIQUE NOT NULL,
      stripe_price_id TEXT,
      status TEXT NOT NULL,
      current_period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      model TEXT,
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0,
      cost_usd NUMERIC(10, 8) DEFAULT 0,
      feature TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS gsc_snapshots (
      id SERIAL PRIMARY KEY,
      property TEXT NOT NULL UNIQUE,
      snapshot JSONB NOT NULL,
      fetched_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS dashboard_analyses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      property TEXT NOT NULL,
      tasks JSONB NOT NULL DEFAULT '[]',
      opportunities JSONB NOT NULL DEFAULT '[]',
      snapshot JSONB,
      crawl JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS dashboard_analyses_user_property_idx
    ON dashboard_analyses (user_id, property, created_at DESC)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS article_ideas (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      property TEXT NOT NULL,
      result JSONB NOT NULL,
      generated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, property)
    )
  `;
}

// ---------- Users ----------

export interface DbUser {
  id: number;
  google_id: string;
  email: string;
  name: string | null;
  picture: string | null;
  stripe_customer_id: string | null;
}

export async function upsertUser(data: {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}): Promise<DbUser> {
  const result = await sql<DbUser>`
    INSERT INTO users (google_id, email, name, picture)
    VALUES (${data.googleId}, ${data.email}, ${data.name ?? null}, ${data.picture ?? null})
    ON CONFLICT (google_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name),
      picture = COALESCE(EXCLUDED.picture, users.picture)
    RETURNING *
  `;
  return result.rows[0];
}

export async function getUserById(id: number): Promise<DbUser | null> {
  const result = await sql<DbUser>`SELECT * FROM users WHERE id = ${id}`;
  return result.rows[0] ?? null;
}

export async function getUserByGoogleId(googleId: string): Promise<DbUser | null> {
  const result = await sql<DbUser>`SELECT * FROM users WHERE google_id = ${googleId}`;
  return result.rows[0] ?? null;
}

export async function setStripeCustomerId(userId: number, customerId: string) {
  await sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${userId}`;
}

// ---------- Subscriptions ----------

export async function upsertSubscription(data: {
  userId: number;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: string;
  currentPeriodEnd: Date;
}) {
  await sql`
    INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_price_id, status, current_period_end)
    VALUES (${data.userId}, ${data.stripeSubscriptionId}, ${data.stripePriceId}, ${data.status}, ${data.currentPeriodEnd.toISOString()})
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      status = EXCLUDED.status,
      stripe_price_id = EXCLUDED.stripe_price_id,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()
  `;
}

export async function getUserSubscription(userId: number) {
  const result = await sql`
    SELECT * FROM subscriptions
    WHERE user_id = ${userId} AND status IN ('active', 'trialing')
    ORDER BY created_at DESC LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function cancelSubscription(stripeSubscriptionId: string) {
  await sql`
    UPDATE subscriptions SET status = 'canceled', updated_at = NOW()
    WHERE stripe_subscription_id = ${stripeSubscriptionId}
  `;
}

// ---------- AI Usage ----------

// Rough cost per token for openrouter/free; real models will override via
// usage data returned by OpenRouter when available.
const COST_PER_PROMPT_TOKEN = 0.0;
const COST_PER_COMPLETION_TOKEN = 0.0;

export async function recordAiUsage(data: {
  userId: number;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  feature: string;
}) {
  await sql`
    INSERT INTO ai_usage (user_id, model, prompt_tokens, completion_tokens, cost_usd, feature)
    VALUES (${data.userId}, ${data.model}, ${data.promptTokens}, ${data.completionTokens}, ${data.costUsd}, ${data.feature})
  `;
}

export async function getMonthlyUsageCost(userId: number): Promise<number> {
  const result = await sql`
    SELECT COALESCE(SUM(cost_usd), 0) AS total
    FROM ai_usage
    WHERE user_id = ${userId}
      AND created_at >= DATE_TRUNC('month', NOW())
  `;
  return parseFloat(result.rows[0]?.total ?? "0");
}

export const FREE_CAP_USD = 0.10;
export const PRO_CAP_USD = Infinity;

// ---------- GSC Snapshot Cache ----------

const SNAPSHOT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function getCachedSnapshot(property: string): Promise<unknown | null> {
  try {
    const result = await sql`
      SELECT snapshot, fetched_at FROM gsc_snapshots
      WHERE property = ${property}
        AND fetched_at > NOW() - INTERVAL '30 minutes'
    `;
    return result.rows[0]?.snapshot ?? null;
  } catch {
    return null;
  }
}

export async function setCachedSnapshot(property: string, snapshot: unknown): Promise<void> {
  try {
    await sql`
      INSERT INTO gsc_snapshots (property, snapshot)
      VALUES (${property}, ${JSON.stringify(snapshot)})
      ON CONFLICT (property) DO UPDATE SET
        snapshot = EXCLUDED.snapshot,
        fetched_at = NOW()
    `;
  } catch {
    // Silently fail — in-memory cache is the fallback
  }
}

export async function deleteCachedSnapshot(property: string): Promise<void> {
  try {
    await sql`DELETE FROM gsc_snapshots WHERE property = ${property}`;
  } catch {
    // Silently fail
  }
}

// ---------- Dashboard Analyses Cache ----------

export interface AnalysisSummary {
  id: number;
  property: string;
  created_at: string;
  top_task_title: string | null;
}

export async function saveAnalysis(
  userId: number,
  property: string,
  data: { tasks: unknown; opportunities: unknown; snapshot: unknown; crawl: unknown }
): Promise<void> {
  await sql`
    INSERT INTO dashboard_analyses (user_id, property, tasks, opportunities, snapshot, crawl)
    VALUES (
      ${userId}, ${property},
      ${JSON.stringify(data.tasks)},
      ${JSON.stringify(data.opportunities)},
      ${JSON.stringify(data.snapshot)},
      ${JSON.stringify(data.crawl)}
    )
  `;
}

export async function getLatestAnalysis(
  userId: number,
  property: string
): Promise<{ tasks: unknown; opportunities: unknown; snapshot: unknown; crawl: unknown } | null> {
  try {
    const result = await sql<{ tasks: unknown; opportunities: unknown; snapshot: unknown; crawl: unknown }>`
      SELECT tasks, opportunities, snapshot, crawl
      FROM dashboard_analyses
      WHERE user_id = ${userId} AND property = ${property}
      ORDER BY created_at DESC LIMIT 1
    `;
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getAnalysisHistory(userId: number): Promise<AnalysisSummary[]> {
  try {
    const result = await sql<AnalysisSummary>`
      SELECT id, property, created_at, tasks->0->>'title' AS top_task_title
      FROM dashboard_analyses
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return result.rows;
  } catch {
    return [];
  }
}

// ---------- Article Ideas ----------

export async function saveArticleIdeas(
  userId: number,
  property: string,
  result: unknown
): Promise<void> {
  await sql`
    INSERT INTO article_ideas (user_id, property, result, generated_at)
    VALUES (${userId}, ${property}, ${JSON.stringify(result)}, NOW())
    ON CONFLICT (user_id, property) DO UPDATE
    SET result = EXCLUDED.result, generated_at = NOW()
  `;
}

export async function getLatestArticleIdeas(
  userId: number,
  property: string
): Promise<unknown | null> {
  try {
    const r = await sql`
      SELECT result FROM article_ideas
      WHERE user_id = ${userId} AND property = ${property}
    `;
    return r.rows[0]?.result ?? null;
  } catch {
    return null;
  }
}
