import { AverageQualityCard } from "../components/AverageQualityCard";
import { FeatureCompletionCard } from "../components/FeatureCompletionCard";
import { TotalTokensCard } from "../components/TotalTokensCard";
import { TotalIterationsCard } from "../components/TotalIterationsCard";
import { BuildTimeCards } from "../components/BuildTimeCards";

export default function OverviewPage() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">AgentForge</h2>
      <p className="text-sm text-zinc-400">Self-referential metrics dashboard — built autonomously by a Ralph Loop with quality backpressure</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FeatureCompletionCard />
        <AverageQualityCard />
        <BuildTimeCards />
        <TotalIterationsCard />
        <TotalTokensCard />
      </div>
    </section>
  );
}
