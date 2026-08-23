import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import type { PrioritizedSkill } from "@/lib/skill-classification";

interface NextBestActionProps {
  topSkill: PrioritizedSkill;
  onOpenAgent: (agentId: string) => void;
}

export function NextBestAction({ topSkill, onOpenAgent }: NextBestActionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-white to-white dark:via-gray-900 dark:to-gray-900 p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
            <Zap className="h-3 w-3" />
            <span>Your Next Best Action</span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Strengthen {topSkill.name}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Your current evaluation is <span className="font-semibold text-red-600 dark:text-red-400">{topSkill.level}</span>.{" "}
            {topSkill.whyItMatters}
          </p>

          <p className="text-xs font-medium text-gray-900 dark:text-white">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Recommended Next Step:</span> {topSkill.whatToDoNext}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:items-end">
          <Button size="lg" className="w-full sm:w-auto" onClick={() => onOpenAgent(topSkill.recommendedAgentId)}>
            Start Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400">Opens specialized AI Coach</span>
        </div>
      </div>
    </div>
  );
}
