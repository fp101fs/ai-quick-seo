import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon-512.png" className="w-8 h-8 rounded-lg" alt="SerpClerk" />
            <span className="font-bold tracking-tight">SerpClerk</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: June 11, 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Who we are</h2>
            <p>
              AI SEO ("we", "our", "us") is a web application that helps website owners analyze
              their Google Search Console data and take AI-powered SEO actions. Our service is
              available at{" "}
              <a href={process.env.NEXT_PUBLIC_SITE_URL ?? "#"} className="text-indigo-600 hover:underline">
                {process.env.NEXT_PUBLIC_SITE_URL ?? "our website"}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Data we collect</h2>
            <p className="mb-3">
              When you sign in with Google, we collect and store:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your Google account ID (a unique identifier, not your password)</li>
              <li>Your email address</li>
              <li>Your name and profile picture (if provided by Google)</li>
            </ul>
            <p className="mt-3">
              When you use AI-powered features, we record: the AI model used, approximate token
              counts, and estimated cost — to enforce usage limits and display your usage meter.
              We do <strong>not</strong> store the content of your AI prompts or responses.
            </p>
            <p className="mt-3">
              If you upgrade to Pro, Stripe handles payment processing. We store your Stripe
              customer ID and subscription status, but never your card number or billing details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Google Search Console data</h2>
            <p>
              With your permission, AI SEO reads your Google Search Console data (clicks,
              impressions, queries, pages). This data is used in real time to generate
              recommendations and is cached briefly for performance. We do not sell, share, or
              permanently store your GSC data beyond the active session.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To authenticate you and maintain your session</li>
              <li>To enforce free-tier usage limits and display your usage meter</li>
              <li>To process subscription payments via Stripe</li>
              <li>To personalize the app with your name and profile picture</li>
            </ul>
            <p className="mt-3">We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data retention</h2>
            <p>
              Your account data is retained as long as your account is active. AI usage records
              are retained for 12 months. You may request deletion of your account and all
              associated data by emailing{" "}
              <a href="mailto:support@ai-seo.app" className="text-indigo-600 hover:underline">
                support@ai-seo.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Cookies</h2>
            <p>
              We use httpOnly cookies to maintain your session (Google OAuth tokens, selected
              Search Console property, user ID). These are functional cookies required to operate
              the service. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Third-party services</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Google OAuth & Search Console API</strong> — for authentication and data
                access
              </li>
              <li>
                <strong>OpenRouter</strong> — AI inference provider; your prompts are processed
                under their privacy policy
              </li>
              <li>
                <strong>Stripe</strong> — payment processing; subject to Stripe&apos;s privacy policy
              </li>
              <li>
                <strong>Vercel / Neon</strong> — hosting and database infrastructure
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Your rights</h2>
            <p>
              You can disconnect Google Search Console access at any time via your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Google account permissions
              </a>
              . To delete your AI SEO account and data, email{" "}
              <a href="mailto:support@ai-seo.app" className="text-indigo-600 hover:underline">
                support@ai-seo.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Significant changes will be
              communicated via email to registered users. Continued use of the service after
              changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Contact</h2>
            <p>
              Questions or requests:{" "}
              <a href="mailto:support@ai-seo.app" className="text-indigo-600 hover:underline">
                support@ai-seo.app
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="hover:text-slate-600 transition-colors">
            Home
          </Link>
          <Link href="/terms" className="hover:text-slate-600 transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
