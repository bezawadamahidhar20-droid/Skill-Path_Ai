import React from "react";
import { Button } from "@/components/ui/button";
import type { AIAgentDefinition } from "@/lib/agents/definitions";
import {
  Compass,
  Target,
  Code2,
  FileText,
  MessageSquareCode,
  Briefcase,
  Send,
  Mic,
  ArrowRight,
} from "lucide-react";

interface AIAgentCardProps {
  agent: AIAgentDefinition;
  onOpen: (agentId: string) => void;
}

export function AIAgentCard({ agent, onOpen }: AIAgentCardProps) {
  const renderIcon = (name: string) => {
    switch (name) {
      case "Compass":
        return <Compass className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "Target":
        return <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "Code2":
        return <Code2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "FileText":
        return <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "MessageSquareCode":
        return <MessageSquareCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "Briefcase":
        return <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "Send":
        return <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "Mic":
        return <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all hover:border-blue-500/40 hover:shadow-md">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            {renderIcon(agent.iconName)}
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{agent.name}</h4>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{agent.roleTitle}</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{agent.purpose}</p>

        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2.5 border border-gray-200/50 dark:border-gray-800 text-[11px]">
          <span className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
            Recommended Focus:
          </span>
          <p className="mt-0.5 font-medium text-gray-900 dark:text-white">{agent.recommendedFocus}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <Button size="sm" className="w-full justify-between" onClick={() => onOpen(agent.id)}>
          <span>{agent.actionText}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
