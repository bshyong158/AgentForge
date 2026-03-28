import { CumulativeCompletionChart } from "../../components/CumulativeCompletionChart";

export default function TimelinePage() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Build Timeline</h2>
      <p className="text-sm text-zinc-400">Progress over time from completed feature timestamps.</p>
      <CumulativeCompletionChart />
    </section>
  );
}
