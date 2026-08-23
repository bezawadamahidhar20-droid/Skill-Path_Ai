export interface AgentContext {
  userId?: string | number;
  userName: string;
  targetRole: string;
  readinessScore: number;
  readinessLevel: string;
  priorityGaps: {
    skill: string;
    level: string;
    priority: string;
  }[];
  activeRoadmapTasks: {
    title: string;
    category: string;
    status: string;
  }[];
  projectsCount?: number;
  internshipsCount?: number;
}

export function buildAgentContextSummary(context: AgentContext): string {
  const gapsList = context.priorityGaps.length > 0
    ? context.priorityGaps.map((g) => `${g.skill} (${g.level})`).join(", ")
    : "None identified";

  return `
Student Profile Context:
- Name: ${context.userName}
- Target Career Goal: ${context.targetRole}
- Overall Readiness Score: ${context.readinessScore}/100 (${context.readinessLevel})
- Key Priority Gaps: ${gapsList}
- Projects Completed: ${context.projectsCount ?? 0}
- Internships: ${context.internshipsCount ?? 0}
`.trim();
}
