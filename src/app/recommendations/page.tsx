/**
 * For You page — personalized resource feed based on search history.
 * Compact hero header that mirrors the Search page's design language
 * without dominating the viewport.
 */

import { RecommendationFeed } from "@/components/recommendation-feed";

export default function RecommendationsPage() {
  return (
    <>
      <section className="hero-gradient -mt-[1px] pb-8 pt-10 sm:pt-14">
        <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--california-gold)]">
            Personalized
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Recommended for you
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/45">
            Resources curated from your recent searches. Tap any card to see eligibility and next steps.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-6">
        <RecommendationFeed />
      </main>
    </>
  );
}
