import { CostPerFeatureLineChart } from "../../components/CostPerFeatureLineChart";
import { RunningTotalCostProjectionChart } from "../../components/RunningTotalCostProjectionChart";
import { TokenSpendPieChart } from "../../components/TokenSpendPieChart";

export default function TokensPage() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Token Economics</h2>
      <p className="text-sm text-zinc-400">Token usage distribution across the coder and evaluator roles.</p>
      <TokenSpendPieChart />
      <CostPerFeatureLineChart />
      <RunningTotalCostProjectionChart />
    </section>
  );
}
