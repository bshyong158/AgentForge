import { FeatureCompletionCard } from "../components/FeatureCompletionCard";

export default function OverviewPage() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">AgentForge</h2>
      <p className="text-sm text-zinc-400">Overview</p>
      <FeatureCompletionCard />
    </section>
  );
}
