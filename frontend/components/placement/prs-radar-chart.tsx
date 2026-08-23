"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

interface RadarChartProps {
  studentBreakdown?: Record<string, number>;
  targetRole?: string;
}

export function PRSRadarChart({ studentBreakdown, targetRole = "Software Engineer" }: RadarChartProps) {
  const data = [
    {
      subject: "GitHub Depth",
      Student: studentBreakdown?.github_score_25 ? Math.round((studentBreakdown.github_score_25 / 25) * 100) : 80,
      Benchmark: 85,
    },
    {
      subject: "Skill Vector",
      Student: studentBreakdown?.skills_score_15 ? Math.round((studentBreakdown.skills_score_15 / 15) * 100) : 75,
      Benchmark: 90,
    },
    {
      subject: "Academic CGPA",
      Student: studentBreakdown?.cgpa_score_10 ? Math.round((studentBreakdown.cgpa_score_10 / 10) * 100) : 88,
      Benchmark: 80,
    },
    {
      subject: "Commit Activity",
      Student: studentBreakdown?.activity_score_10 ? Math.round((studentBreakdown.activity_score_10 / 10) * 100) : 70,
      Benchmark: 75,
    },
    {
      subject: "Tech Diversity",
      Student: studentBreakdown?.project_diversity_score_10 ? Math.round((studentBreakdown.project_diversity_score_10 / 10) * 100) : 80,
      Benchmark: 80,
    },
    {
      subject: "Resume ATS",
      Student: studentBreakdown?.resume_ats_score_20 ? Math.round((studentBreakdown.resume_ats_score_20 / 20) * 100) : 85,
      Benchmark: 90,
    },
  ];

  return (
    <Card className="border border-neutral-800 bg-neutral-900/60 backdrop-blur-md shadow-xl text-white">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            Skill Vector Alignment vs Benchmark
          </CardTitle>
          <p className="text-xs text-neutral-400 mt-1">
            Comparing your profile against Tier-1 {targetRole} requirements
          </p>
        </div>
      </CardHeader>
      <CardContent className="h-[280px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#6B7280", fontSize: 9 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", borderRadius: "8px", color: "#FFF" }}
            />
            <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
            <Radar name="Your Profile" dataKey="Student" stroke="#6366F1" fill="#6366F1" fillOpacity={0.4} />
            <Radar name="Tier-1 Benchmark" dataKey="Benchmark" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
