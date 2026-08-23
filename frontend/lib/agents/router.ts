import { AI_AGENTS, type AIAgentDefinition } from "./definitions";

export function routeUserQueryToAgent(query: string): AIAgentDefinition {
  const lower = query.toLowerCase();

  if (lower.includes("dsa") || lower.includes("algorithm") || lower.includes("leetcode") || lower.includes("code") || lower.includes("two pointer") || lower.includes("array")) {
    return AI_AGENTS.find((a) => a.id === "dsa-coach")!;
  }
  if (lower.includes("resume") || lower.includes("ats") || lower.includes("cv") || lower.includes("bullet")) {
    return AI_AGENTS.find((a) => a.id === "resume-agent")!;
  }
  if (lower.includes("mock") || lower.includes("interview") || lower.includes("star method") || lower.includes("behavioral")) {
    return AI_AGENTS.find((a) => a.id === "interview-coach")!;
  }
  if (lower.includes("job") || lower.includes("jd") || lower.includes("match") || lower.includes("company")) {
    return AI_AGENTS.find((a) => a.id === "job-match-agent")!;
  }
  if (lower.includes("referral") || lower.includes("linkedin") || lower.includes("outreach") || lower.includes("email")) {
    return AI_AGENTS.find((a) => a.id === "application-coach")!;
  }
  if (lower.includes("speak") || lower.includes("communication") || lower.includes("present") || lower.includes("confidence")) {
    return AI_AGENTS.find((a) => a.id === "communication-coach")!;
  }
  if (lower.includes("skill") || lower.includes("sql") || lower.includes("gap") || lower.includes("learn")) {
    return AI_AGENTS.find((a) => a.id === "skill-coach")!;
  }

  return AI_AGENTS.find((a) => a.id === "career-strategist")!;
}
