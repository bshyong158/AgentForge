import { FeatureTable } from "../../components/FeatureTable";
import { FeatureTimelineGanttChart } from "../../components/FeatureTimelineGanttChart";

export default function FeaturesPage() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Feature Table</h2>
      <p className="text-sm text-zinc-400">Sortable details for all features in the build plan.</p>
      <FeatureTable />
      <FeatureTimelineGanttChart />
    </section>
  );
}
