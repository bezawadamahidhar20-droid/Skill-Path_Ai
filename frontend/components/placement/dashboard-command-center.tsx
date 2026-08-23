'use client'

import React, { useState } from "react";
import { PlacementReadinessHeader } from "./placement-readiness-header";
import { CareerTargetCard } from "./career-target-card";
import { NextBestAction } from "./next-best-action";
import { PrioritySkills } from "./priority-skills";
import { JobReadinessRoadmap, type RoadmapTaskItem } from "./job-readiness-roadmap";
import { AIAgentCenter } from "./ai-agent-center";
import { AIAgentWorkspace } from "./ai-agent-workspace";
import { PRSRadarChart } from "./prs-radar-chart";
import { PRSProgressChart } from "./prs-progress-chart";
import { AgenticCopilot } from "./agentic-copilot";
import type { PrioritizedSkill } from "@/lib/skill-classification";
import type { AgentContext } from "@/lib/agents/context";

interface DashboardCommandCenterProps {
  userName: string;
  targetRole: string;
  readinessScore: number;
  readinessLevel: string;
  prioritizedSkills: PrioritizedSkill[];
  roadmapTasks: RoadmapTaskItem[];
  agentContext: AgentContext;
  prsBreakdown?: Record<string, number>;
  onRoleChange?: (newRole: string) => void;
  onAddTaskToRoadmap?: (task: { title: string; category: string; description: string }) => void;
}

export function DashboardCommandCenter({
  userName,
  targetRole,
  readinessScore,
  readinessLevel,
  prioritizedSkills,
  roadmapTasks,
  agentContext,
  prsBreakdown,
  onRoleChange,
  onAddTaskToRoadmap,
}: DashboardCommandCenterProps) {
  const [activeAgentModalId, setActiveAgentModalId] = useState<string | null>(null);

  const topSkillGap = prioritizedSkills[0];
  const strongAreasCount = prioritizedSkills.filter((s) => s.level === "Good" || s.level === "Perfect").length;
  const gapsCount = prioritizedSkills.filter((s) => s.level === "Below Average" || s.level === "Average").length;

  return (
    <div className="space-y-8">
      {/* 1. Placement Readiness Command Center Header */}
      <PlacementReadinessHeader
        userName={userName}
        targetRole={targetRole}
        readinessScore={readinessScore}
        readinessLevel={readinessLevel}
        strongAreasCount={strongAreasCount}
        gapsCount={gapsCount}
      />

      {/* 2. Visual Analytics Grid: Radar Chart & Historical Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PRSRadarChart studentBreakdown={prsBreakdown} targetRole={targetRole} />
        <PRSProgressChart currentScore={readinessScore} />
      </div>

      {/* 3. Agentic Placement Co-Pilot & STAR Mock Interviewer */}
      <AgenticCopilot />

      {/* 4. Target Career Goal Card */}
      <CareerTargetCard targetRole={targetRole} onRoleChange={onRoleChange} />

      {/* 5. Your Next Best Action */}
      {topSkillGap ? (
        <NextBestAction
          topSkill={topSkillGap}
          onOpenAgent={(agentId) => setActiveAgentModalId(agentId)}
        />
      ) : null}

      {/* 6. Priority Skill Readiness Matrix */}
      <PrioritySkills
        skills={prioritizedSkills}
        targetRole={targetRole}
        onOpenAgent={(agentId) => setActiveAgentModalId(agentId)}
      />

      {/* 7. Job-Readiness Employment Roadmap (6 Stages) */}
      <JobReadinessRoadmap
        targetRole={targetRole}
        tasks={roadmapTasks}
        onOpenAgent={(agentId) => setActiveAgentModalId(agentId)}
      />

      {/* 8. AI Career Preparation Team (8 Specialized Agents) */}
      <AIAgentCenter onOpenAgent={(agentId) => setActiveAgentModalId(agentId)} />

      {/* Interactive AI Agent Workspace Dialog */}
      {activeAgentModalId ? (
        <AIAgentWorkspace
          initialAgentId={activeAgentModalId}
          userContext={agentContext}
          onClose={() => setActiveAgentModalId(null)}
          onAddTaskToRoadmap={onAddTaskToRoadmap}
        />
      ) : null}
    </div>
  );
}
