import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSkillLevelTone, type PrioritizedSkill } from "@/lib/skill-classification";
import { ArrowRight, Bot } from "lucide-react";

interface SkillReadinessCardProps {
  skill: PrioritizedSkill;
  onOpenAgent: (agentId: string) => void;
}

export function SkillReadinessCard({ skill, onOpenAgent }: SkillReadinessCardProps) {
  const tone = getSkillLevelTone(skill.level);

  return (
    <div className={`flex flex-col justify-between rounded-2xl border p-5 transition-all hover:shadow-md bg-white dark:bg-gray-900 ${tone.border}`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {skill.priority}
            </span>
            <h4 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{skill.name}</h4>
          </div>

          <Badge variant={skill.level === "Below Average" ? "destructive" : "default"} className="shrink-0 font-semibold px-2.5 py-1">
            {skill.level}
          </Badge>
        </div>

        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
          <p>
            <strong className="text-gray-900 dark:text-white">Why it matters:</strong> {skill.whyItMatters}
          </p>
          <p>
            <strong className="text-blue-600 dark:text-blue-400">Next action:</strong> {skill.whatToDoNext}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          <Bot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>AI Coach Ready</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenAgent(skill.recommendedAgentId)}
          className="hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400"
        >
          Work on Skill <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
