interface MetricsSectionSkeletonProps {
  ariaLabel: string;
  variant?: "card" | "chart" | "table" | "feed" | "panel";
}

function SkeletonBar({ className }: { className: string }) {
  return <div className={`rounded bg-zinc-800/80 ${className}`} aria-hidden="true" />;
}

function CardSkeletonBody() {
  return (
    <>
      <SkeletonBar className="mb-4 h-4 w-36" />
      <SkeletonBar className="h-10 w-28" />
      <SkeletonBar className="mt-4 h-3 w-full" />
      <SkeletonBar className="mt-3 h-3 w-24" />
    </>
  );
}

function ChartSkeletonBody() {
  return (
    <>
      <SkeletonBar className="mb-4 h-4 w-48" />
      <SkeletonBar className="h-80 w-full" />
    </>
  );
}

function TableSkeletonBody() {
  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <SkeletonBar className="h-9 w-full" />
        <SkeletonBar className="h-9 w-full" />
      </div>
      <div className="space-y-2 rounded-lg border border-zinc-800 p-3">
        <SkeletonBar className="h-6 w-full" />
        <SkeletonBar className="h-10 w-full" />
        <SkeletonBar className="h-10 w-full" />
        <SkeletonBar className="h-10 w-full" />
        <SkeletonBar className="h-10 w-full" />
        <SkeletonBar className="h-10 w-full" />
      </div>
    </>
  );
}

function FeedSkeletonBody() {
  return (
    <>
      <SkeletonBar className="mb-4 h-4 w-40" />
      <div className="space-y-3">
        <div className="rounded-lg border border-zinc-800 p-4">
          <SkeletonBar className="h-4 w-3/4" />
          <SkeletonBar className="mt-2 h-3 w-1/2" />
        </div>
        <div className="rounded-lg border border-zinc-800 p-4">
          <SkeletonBar className="h-4 w-2/3" />
          <SkeletonBar className="mt-2 h-3 w-1/3" />
        </div>
        <div className="rounded-lg border border-zinc-800 p-4">
          <SkeletonBar className="h-4 w-4/5" />
          <SkeletonBar className="mt-2 h-3 w-2/5" />
        </div>
      </div>
    </>
  );
}

function PanelSkeletonBody() {
  return (
    <>
      <SkeletonBar className="mb-4 h-4 w-52" />
      <div className="space-y-3">
        <div className="rounded-lg border border-zinc-800 p-4">
          <SkeletonBar className="h-4 w-1/4" />
          <SkeletonBar className="mt-2 h-3 w-full" />
          <SkeletonBar className="mt-2 h-3 w-2/3" />
        </div>
        <div className="rounded-lg border border-zinc-800 p-4">
          <SkeletonBar className="h-4 w-1/3" />
          <SkeletonBar className="mt-2 h-3 w-full" />
          <SkeletonBar className="mt-2 h-3 w-3/4" />
        </div>
      </div>
    </>
  );
}

function renderSkeletonBody(variant: NonNullable<MetricsSectionSkeletonProps["variant"]>) {
  if (variant === "card") {
    return <CardSkeletonBody />;
  }

  if (variant === "table") {
    return <TableSkeletonBody />;
  }

  if (variant === "feed") {
    return <FeedSkeletonBody />;
  }

  if (variant === "panel") {
    return <PanelSkeletonBody />;
  }

  return <ChartSkeletonBody />;
}

export function MetricsSectionSkeleton({ ariaLabel, variant = "chart" }: MetricsSectionSkeletonProps) {
  return (
    <section
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      aria-label={`${ariaLabel} loading`}
      role="status"
      aria-live="polite"
    >
      <div className="animate-pulse">{renderSkeletonBody(variant)}</div>
      <span className="sr-only">Loading metrics...</span>
    </section>
  );
}
