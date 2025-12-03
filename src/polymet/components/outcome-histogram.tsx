import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { SimulationResult } from "@/polymet/data/scenario-engine";

interface OutcomeHistogramProps {
  result: SimulationResult;
}

export function OutcomeHistogram({ result }: OutcomeHistogramProps) {
  // Create histogram bins (30 bins)
  const numBins = 30;
  const outcomes = result.outcomes;

  if (!outcomes || outcomes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        No outcome data available
      </div>
    );
  }

  const min = Math.min(...outcomes);
  const max = Math.max(...outcomes);
  const binWidth = (max - min) / numBins;

  // Create bins
  const bins = Array.from({ length: numBins }, (_, i) => ({
    binStart: min + i * binWidth,
    binEnd: min + (i + 1) * binWidth,
    count: 0,
  }));

  // Fill bins
  outcomes.forEach((outcome) => {
    const binIndex = Math.min(
      Math.floor((outcome - min) / binWidth),
      numBins - 1
    );
    bins[binIndex].count++;
  });

  // Transform for chart
  const chartData = bins.map((bin) => ({
    binLabel: bin.binStart.toFixed(0),
    count: bin.count,
    binMid: (bin.binStart + bin.binEnd) / 2,
  }));

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />

          <XAxis
            dataKey="binLabel"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            angle={-45}
            textAnchor="end"
            height={60}
            label={{
              value: "Outcome Value",
              position: "insideBottom",
              offset: -10,
              style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
            }}
          />

          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            label={{
              value: "Frequency",
              angle: -90,
              position: "insideLeft",
              style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
            }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              color: "hsl(var(--popover-foreground))",
            }}
            labelStyle={{ color: "hsl(var(--popover-foreground))" }}
          />

          <Bar
            dataKey="count"
            fill="hsl(var(--primary))"
            radius={[2, 2, 0, 0]}
            opacity={0.8}
          />

          {/* EV Line - thin vertical line */}
          <ReferenceLine
            x={chartData.find((d) => d.binMid >= result.ev)?.binLabel}
            stroke="hsl(142, 71%, 45%)"
            strokeWidth={1}
            label={{
              value: "EV",
              position: "top",
              fill: "hsl(142, 71%, 45%)",
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          {/* VaR95 Line - thin vertical line */}
          <ReferenceLine
            x={chartData.find((d) => d.binMid >= result.var95)?.binLabel}
            stroke="hsl(0, 84%, 60%)"
            strokeWidth={1}
            label={{
              value: "VaR95",
              position: "top",
              fill: "hsl(0, 84%, 60%)",
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Caption with metrics */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />

          <span className="text-muted-foreground">
            EV: <span className="font-semibold">{result.ev.toFixed(2)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />

          <span className="text-muted-foreground">
            VaR95:{" "}
            <span className="font-semibold">{result.var95.toFixed(2)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />

          <span className="text-muted-foreground">
            CVaR95:{" "}
            <span className="font-semibold">{result.cvar95.toFixed(2)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
