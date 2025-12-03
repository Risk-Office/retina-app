import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { SimulationResult } from "@/polymet/data/scenario-engine";
import type { RAROCThresholds } from "@/polymet/data/tenant-settings";

interface RAROCBarChartProps {
  results: SimulationResult[];
  thresholds: RAROCThresholds;
  onBarClick?: (optionId: string) => void;
  selectedOptionId?: string;
}

export function RAROCBarChart({
  results,
  thresholds,
  onBarClick,
  selectedOptionId,
}: RAROCBarChartProps) {
  // Get bar color based on RAROC thresholds
  const getBarColor = (raroc: number) => {
    if (raroc < thresholds.red) {
      return "hsl(0, 84%, 60%)"; // red
    } else if (raroc < thresholds.amber) {
      return "hsl(43, 74%, 66%)"; // amber
    } else {
      return "hsl(142, 71%, 45%)"; // green
    }
  };

  // Transform data for chart
  const chartData = results.map((result) => ({
    label: result.optionLabel,
    raroc: result.raroc,
    optionId: result.optionId,
  }));

  // Custom label renderer with 2 decimals
  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="hsl(var(--foreground))"
        textAnchor="middle"
        fontSize={12}
        fontWeight={500}
      >
        {value.toFixed(2)}
      </text>
    );
  };

  return (
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
          dataKey="label"
          stroke="hsl(var(--muted-foreground))"
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 12 }}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(value: number) => value.toFixed(4)}
          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
        />

        <Bar
          dataKey="raroc"
          radius={[4, 4, 0, 0]}
          onClick={(data) => onBarClick?.(data.optionId)}
          cursor="pointer"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getBarColor(entry.raroc)}
              opacity={
                selectedOptionId
                  ? entry.optionId === selectedOptionId
                    ? 1
                    : 0.4
                  : 1
              }
            />
          ))}
          <LabelList content={renderCustomLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
