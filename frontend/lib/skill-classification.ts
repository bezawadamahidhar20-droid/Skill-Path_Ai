export type SkillLevel = "Below Average" | "Average" | "Good" | "Perfect";

export type SkillPriority = "HIGH PRIORITY" | "MEDIUM PRIORITY" | "MAINTAIN";

export interface PrioritizedSkill {
  id: string;
  name: string;
  score: number;
  level: SkillLevel;
  priority: SkillPriority;
  whyItMatters: string;
  whatToDoNext: string;
  recommendedAgentId: string;
}

export function classifySkillScore(score: number): SkillLevel {
  if (score >= 88) return "Perfect";
  if (score >= 72) return "Good";
  if (score >= 50) return "Average";
  return "Below Average";
}

export function getSkillLevelTone(level: SkillLevel): {
  badge: "danger" | "warning" | "primary" | "success";
  border: string;
  text: string;
} {
  switch (level) {
    case "Below Average":
      return {
        badge: "danger",
        border: "border-red-500/30 bg-red-500/5",
        text: "text-red-600 dark:text-red-400",
      };
    case "Average":
      return {
        badge: "warning",
        border: "border-amber-500/30 bg-amber-500/5",
        text: "text-amber-600 dark:text-amber-400",
      };
    case "Good":
      return {
        badge: "primary",
        border: "border-blue-500/30 bg-blue-500/5",
        text: "text-blue-600 dark:text-blue-400",
      };
    case "Perfect":
      return {
        badge: "success",
        border: "border-emerald-500/30 bg-emerald-500/5",
        text: "text-emerald-600 dark:text-emerald-400",
      };
  }
}

export function getRoleSkillPriorities(
  targetRole: string,
  assessmentData: {
    dsa?: number;
    codingScore?: number;
    sqlScore?: number;
    webDev?: number;
    gitScore?: number;
    quant?: number;
    logical?: number;
    verbal?: number;
    communication?: number;
    interviewConfidence?: number;
    presentation?: number;
  }
): PrioritizedSkill[] {
  const dsaScore = assessmentData.dsa ?? assessmentData.codingScore ?? 60;
  const sqlScore = assessmentData.sqlScore ?? 65;
  const webDevScore = assessmentData.webDev ?? 70;
  const commScore = assessmentData.communication ?? assessmentData.verbal ?? 65;
  const interviewScore = assessmentData.interviewConfidence ?? assessmentData.presentation ?? 70;
  const quantScore = assessmentData.quant ?? assessmentData.logical ?? 65;

  const role = targetRole.toLowerCase();

  const allSkills: PrioritizedSkill[] = [
    {
      id: "dsa",
      name: "Data Structures & Algorithms",
      score: dsaScore,
      level: classifySkillScore(dsaScore),
      priority: role.includes("software") || role.includes("full") || role.includes("dsa") ? "HIGH PRIORITY" : "MEDIUM PRIORITY",
      whyItMatters: "Essential for clearing automated technical screening rounds and online coding assessments.",
      whatToDoNext: "Practice 5 array/string problems using the Two Pointer & Hash Map patterns.",
      recommendedAgentId: "dsa-coach",
    },
    {
      id: "webdev",
      name: "Full Stack & Web Architecture",
      score: webDevScore,
      level: classifySkillScore(webDevScore),
      priority: role.includes("full") || role.includes("web") || role.includes("frontend") ? "HIGH PRIORITY" : "MEDIUM PRIORITY",
      whyItMatters: "Proves production engineering readiness and project portfolio credibility.",
      whatToDoNext: "Deploy an API integration project with clean GitHub documentation.",
      recommendedAgentId: "skill-coach",
    },
    {
      id: "sql",
      name: "Database Systems & SQL Fluency",
      score: sqlScore,
      level: classifySkillScore(sqlScore),
      priority: role.includes("data") || role.includes("analyst") || role.includes("backend") ? "HIGH PRIORITY" : "MEDIUM PRIORITY",
      whyItMatters: "Critical for data manipulation, backend optimization, and technical case studies.",
      whatToDoNext: "Practice multi-table JOINs, subqueries, and window functions.",
      recommendedAgentId: "skill-coach",
    },
    {
      id: "communication",
      name: "Technical Communication & Defense",
      score: commScore,
      level: classifySkillScore(commScore),
      priority: role.includes("product") || role.includes("manager") || role.includes("consultant") ? "HIGH PRIORITY" : "MEDIUM PRIORITY",
      whyItMatters: "Determines interview performance when explaining system tradeoffs to hiring managers.",
      whatToDoNext: "Practice explaining your main project using the STAR method in 3 minutes.",
      recommendedAgentId: "communication-coach",
    },
    {
      id: "interview",
      name: "Interview Preparedness & STAR Method",
      score: interviewScore,
      level: classifySkillScore(interviewScore),
      priority: "MEDIUM PRIORITY",
      whyItMatters: "High impact on final HR & System Architecture interview round selection.",
      whatToDoNext: "Prepare structured answers for behavioral and project challenge questions.",
      recommendedAgentId: "interview-coach",
    },
    {
      id: "aptitude",
      name: "Quantitative & Analytical Reasoning",
      score: quantScore,
      level: classifySkillScore(quantScore),
      priority: "MAINTAIN",
      whyItMatters: "Sustains performance in initial campus placement aptitude screenings.",
      whatToDoNext: "Complete a 15-minute timed mock quantitative reasoning set.",
      recommendedAgentId: "skill-coach",
    },
  ];

  // Sort: Below Average first, then Average, then by priority (HIGH PRIORITY first)
  const levelRank: Record<SkillLevel, number> = {
    "Below Average": 0,
    Average: 1,
    Good: 2,
    Perfect: 3,
  };

  const priorityRank: Record<SkillPriority, number> = {
    "HIGH PRIORITY": 0,
    "MEDIUM PRIORITY": 1,
    MAINTAIN: 2,
  };

  return allSkills.sort((a, b) => {
    if (levelRank[a.level] !== levelRank[b.level]) {
      return levelRank[a.level] - levelRank[b.level];
    }
    return priorityRank[a.priority] - priorityRank[b.priority];
  });
}
