import { GitCommitFeed } from "../../components/GitCommitFeed";

export default function GitPage() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Git Visualization</h2>
      <p className="text-sm text-zinc-400">
        Commit history from completed features, including quality-score badges for each change.
      </p>
      <GitCommitFeed />
    </section>
  );
}
