import React from "react";
import { SkillReadinessCard } from "./skill-readiness-card";
import type { PrioritizedSkill } from "@/lib/skill-classification";

interface PrioritySkillsProps {
  skills: PrioritizedSkill[];
  targetRole: string;
  onOpenAgent: (agentId: string) => void;
}

export function PrioritySkills({ skills, targetRole, onOpenAgent }: PrioritySkillsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Priority Skill Readiness</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ordered by placement importance for your target role: {targetRole}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <SkillReadinessCard key={skill.id} skill={skill} onOpenAgent={onOpenAgent} />
        ))}
      </div>
    </div>
  );
}
