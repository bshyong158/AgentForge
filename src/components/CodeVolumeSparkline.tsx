"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export interface CodeVolumeSparklinePoint {
  featureId: number;
  linesAdded: number;
  isCurrent: boolean;
}

interface CodeVolumeSparklineProps {
  data: CodeVolumeSparklinePoint[];
  featureId: number;
}

export function CodeVolumeSparkline({ data, featureId }: CodeVolumeSparklineProps) {
  if (data.length === 0) {
    return <div className="h-10 w-28 min-w-28 rounded bg-zinc-900/70" aria-hidden="true" />;
  }

  return (
    <div className="h-10 w-28 min-w-28" aria-label={`Code volume sparkline for feature ${featureId}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey="linesAdded"
            stroke="#38bdf8"
            strokeWidth={1.75}
            isAnimationActive={false}
            dot={((dotProps: any) => {
              const payload = dotProps?.payload as CodeVolumeSparklinePoint | undefined;

              if (!payload?.isCurrent) {
                return <circle key="empty" r={0} cx={0} cy={0} />;
              }

              return (
                <circle
                  cx={dotProps.cx}
                  cy={dotProps.cy}
                  r={2.25}
                  fill="#67e8f9"
                  stroke="#164e63"
                  strokeWidth={1}
                />
              );
            }) as any}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
