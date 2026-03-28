import { CategoryAverageScoreBarChart } from "../../components/CategoryAverageScoreBarChart";
import { FirstVsFinalScoreScatterPlot } from "../../components/FirstVsFinalScoreScatterPlot";
import { ImprovementTrendScatterPlot } from "../../components/ImprovementTrendScatterPlot";
import { QualityScoreDistributionHistogram } from "../../components/QualityScoreDistributionHistogram";
import { SkippedFeaturesPanel } from "../../components/SkippedFeaturesPanel";

export default function QualityPage() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Quality Analysis</h2>
      <p className="text-sm text-zinc-400">Score distribution across completed features.</p>
      <QualityScoreDistributionHistogram />
      <FirstVsFinalScoreScatterPlot />
      <CategoryAverageScoreBarChart />
      <ImprovementTrendScatterPlot />
      <SkippedFeaturesPanel />
    </section>
  );
}
