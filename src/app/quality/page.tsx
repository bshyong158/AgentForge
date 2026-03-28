import { FirstVsFinalScoreScatterPlot } from "../../components/FirstVsFinalScoreScatterPlot";
import { QualityScoreDistributionHistogram } from "../../components/QualityScoreDistributionHistogram";

export default function QualityPage() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Quality Analysis</h2>
      <p className="text-sm text-zinc-400">Score distribution across completed features.</p>
      <QualityScoreDistributionHistogram />
      <FirstVsFinalScoreScatterPlot />
    </section>
  );
}
