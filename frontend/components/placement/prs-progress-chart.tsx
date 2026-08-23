"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface ProgressChartProps {
  currentScore?: number;
}

export function PRSProgressChart({ currentScore = 87 }: ProgressChartProps) {
  const data = [
    { date: "Week 1", score: 45, label: "Initial Registration" },
    { date: "Week 2", score: 58, label: "Onboarding & Skills Added" },
    { date: "Week 3", score: 68, label: "GitHub Analysis Synchronized" },
    { date: "Week 4", score: 76, label: "Resume ATS Optimized" },
    { date: "Week 5", score: currentScore, label: "Current Placement Readiness" },
  ];

  return (
    <Card className="border border-neutral-800 bg-neutral-900/60 backdrop-blur-md shadow-xl text-white">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Readiness Score Progression (Before vs After)
          </CardTitle>
          <p className="text-xs text-neutral-400 mt-1">
            Measurable impact of completing onboarding and roadmap milestones
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          +{(currentScore - 45)} pts Growth
        </span>
      </CardHeader>
      <CardContent className="h-[280px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", borderRadius: "8px", color: "#FFF" }}
              formatter={(value: any) => [`${value} / 100`, "PRS Score"]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#scoreColor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
