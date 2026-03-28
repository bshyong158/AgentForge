import { AverageQualityCard } from "../components/AverageQualityCard";
import { FeatureCompletionCard } from "../components/FeatureCompletionCard";
import { TotalTokensCard } from "../components/TotalTokensCard";
import { TotalIterationsCard } from "../components/TotalIterationsCard";

export default function OverviewPage() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">AgentForge</h2>
      <p className="text-sm text-zinc-400">Overview</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FeatureCompletionCard />
        <AverageQualityCard />
        <TotalIterationsCard />
        <TotalTokensCard />
      </div>
    </section>
  );
}
