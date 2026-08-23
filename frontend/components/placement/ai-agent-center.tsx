import React from "react";
import { AIAgentCard } from "./ai-agent-card";
import { AI_AGENTS } from "@/lib/agents/definitions";

interface AIAgentCenterProps {
  onOpenAgent: (agentId: string) => void;
}

export function AIAgentCenter({ onOpenAgent }: AIAgentCenterProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Career Preparation Team</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Specialized AI coaches for career strategy, technical skills, resume ATS compliance, and interview mock practice.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AI_AGENTS.map((agent) => (
          <AIAgentCard key={agent.id} agent={agent} onOpen={onOpenAgent} />
        ))}
      </div>
    </div>
  );
}
