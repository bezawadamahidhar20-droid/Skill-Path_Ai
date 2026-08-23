import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target, Award } from "lucide-react";

interface PlacementReadinessHeaderProps {
  userName: string;
  targetRole: string;
  readinessScore: number;
  readinessLevel: string;
  strongAreasCount: number;
  gapsCount: number;
  onOpenAnalysis?: () => void;
}

export function PlacementReadinessHeader({
  userName,
  targetRole,
  readinessScore,
  readinessLevel,
  strongAreasCount,
  gapsCount,
  onOpenAnalysis,
}: PlacementReadinessHeaderProps) {
  const firstName = userName ? userName.split(" ")[0] : "Student";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Target className="h-3.5 w-3.5" />
            <span>Target Role: {targetRole}</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Your CampusIQ preparation plan is optimized for{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{targetRole}</span> placement drives.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-emerald-500" />
              <span>{strongAreasCount} Strong Capabilities</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>{gapsCount} Priority Improvement Areas</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center border-t border-gray-200 dark:border-gray-800 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-blue-600 bg-blue-500/10">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{readinessScore}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">/100</span>
          </div>
          <p className="mt-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Readiness Level
          </p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{readinessLevel}</p>
        </div>
      </div>
    </div>
  );
}
