import Link from "next/link";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: June 11, 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance</h2>
            <p>
              By using AI SEO ("Service"), you agree to these Terms of Service. If you do not
              agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Description of service</h2>
            <p>
              AI SEO is a web application that connects to Google Search Console (read-only),
              analyzes your SEO data, and provides AI-generated recommendations, content drafts,
              and prioritized task lists.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Account and eligibility</h2>
            <p>
              You must be at least 18 years old to use the Service. You are responsible for
              maintaining the security of your account and for all activity under it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Free tier and paid plans</h2>
            <p>
              The Free tier provides limited access to AI-powered features ($0.10/month of AI
              cost). The Pro plan ($10/month) unlocks unlimited AI usage and all features.
              Subscriptions are billed monthly and renew automatically until cancelled.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Payment and cancellation</h2>
            <p>
              Payments are processed by Stripe. You may cancel your subscription at any time from
              the billing portal. Cancellation takes effect at the end of the current billing
              period. We do not offer refunds for partial months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Acceptable use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Service to generate spam, misleading, or illegal content</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the Service</li>
              <li>Share your account credentials with others</li>
              <li>Use the Service in violation of any applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. AI-generated content</h2>
            <p>
              AI-generated recommendations are suggestions only. We make no guarantees about SEO
              outcomes. You are responsible for reviewing and deciding whether to implement any
              AI-generated content on your site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Intellectual property</h2>
            <p>
              Content you submit (URLs, site data) remains yours. AI-generated output produced
              using your data is yours to use. We retain rights to the Service itself, including
              its code, design, and underlying prompts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Disclaimers</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We do not guarantee
              that the Service will be error-free, uninterrupted, or produce specific SEO results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, AI SEO shall not be liable for any indirect,
              incidental, or consequential damages arising from use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">11. Changes</h2>
            <p>
              We may update these Terms at any time. Continued use after changes constitutes
              acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">12. Contact</h2>
            <p>
              Questions:{" "}
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
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
