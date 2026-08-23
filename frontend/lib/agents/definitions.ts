export interface AIAgentDefinition {
  id: string;
  name: string;
  roleTitle: string;
  iconName: string;
  purpose: string;
  systemPrompt: string;
  recommendedFocus: string;
  suggestedPrompts: string[];
  actionText: string;
}

export const AI_AGENTS: AIAgentDefinition[] = [
  {
    id: "career-strategist",
    name: "Career Strategist AI",
    roleTitle: "Placement Strategy & Role Positioning Coach",
    iconName: "Compass",
    purpose: "Analyzes student profile benchmarks to define target role targets, roadmap priorities, and placement drive positioning.",
    recommendedFocus: "Target role alignment & multi-month preparation roadmap",
    suggestedPrompts: [
      "What core skill gaps should I prioritize for a Full Stack Developer role?",
      "How do my readiness score and projects compare to top engineering company benchmarks?",
      "What preparation milestones should I achieve before placement season begins?",
    ],
    actionText: "Talk Strategy",
    systemPrompt: `You are the Lead Career Strategist AI for campus placements. Provide strategic advice on role positioning, target benchmarks, and skill gap priorities.`,
  },
  {
    id: "skill-coach",
    name: "Skill Coach AI",
    roleTitle: "Technical Gap & Execution Specialist",
    iconName: "Target",
    purpose: "Guides targeted practice on technical skill gaps (SQL, Web Architecture, Systems) to raise readiness levels.",
    recommendedFocus: "Technical skill gaps rated Below Average or Average",
    suggestedPrompts: [
      "Explain how to optimize complex SQL JOINs and subqueries.",
      "What web dev concepts are frequently asked in technical interviews?",
      "Give me a step-by-step plan to improve my lowest technical skill score.",
    ],
    actionText: "Close Gaps",
    systemPrompt: `You are the Skill Coach AI. You help students systematically improve their technical knowledge, SQL, Web Dev, and system concepts.`,
  },
  {
    id: "dsa-coach",
    name: "DSA Coach AI",
    roleTitle: "Algorithmic & Problem Solving Specialist",
    iconName: "Code2",
    purpose: "Provides pattern-focused DSA guidance, coding interview walkthroughs, and time/space complexity analysis.",
    recommendedFocus: "Array/String patterns, Two-Pointers, Trees, Graphs, Dynamic Programming",
    suggestedPrompts: [
      "How do I recognize when to use Sliding Window vs Two Pointers?",
      "Walk me through solving the Longest Substring Without Repeating Characters problem.",
      "What are the top 10 DSA patterns tested by top tech companies?",
    ],
    actionText: "Practice DSA",
    systemPrompt: `You are the DSA Coach AI. Focus on algorithmic problem solving, pattern identification, complexity analysis, and clean code implementation.`,
  },
  {
    id: "resume-agent",
    name: "Resume Agent AI",
    roleTitle: "ATS Optimization & Bullet Point Rewriter",
    iconName: "FileText",
    purpose: "Evaluates project bullet points, transforms passive descriptions into action-oriented statements, and verifies keyword density.",
    recommendedFocus: "Action verbs, quantifiable metrics, and ATS compatibility",
    suggestedPrompts: [
      "Rewrite my project description to sound more impactful and quantifiable.",
      "What technical keywords should I add for a Backend Developer resume?",
      "Audit my resume bullet points against recruiter ATS filters.",
    ],
    actionText: "Optimize Resume",
    systemPrompt: `You are the Resume Agent AI. Your job is to make student project descriptions and skills ATS-compliant, action-oriented, and high-impact.`,
  },
  {
    id: "interview-coach",
    name: "Interview Coach AI",
    roleTitle: "Mock Interview & STAR Method Specialist",
    iconName: "MessageSquareCode",
    purpose: "Conducts interactive mock technical and behavioral interviews, teaching students how to structure answers using the STAR method.",
    recommendedFocus: "STAR framework (Situation, Task, Action, Result) & project defense",
    suggestedPrompts: [
      "Ask me a behavioral interview question and evaluate my answer.",
      "How should I explain technical tradeoffs in my main full stack project?",
      "What are common trap questions in HR interview rounds?",
    ],
    actionText: "Start Mock Interview",
    systemPrompt: `You are the Interview Coach AI. Help students master behavioral questions, project defenses, and STAR method structuring.`,
  },
  {
    id: "job-match-agent",
    name: "Job Match Agent AI",
    roleTitle: "Job Description & Requirement Analyzer",
    iconName: "Briefcase",
    purpose: "Audits specific job descriptions against the student's profile to identify match gaps and customized preparation steps.",
    recommendedFocus: "Job description parsing and targeted requirement matching",
    suggestedPrompts: [
      "Paste a job description to audit missing skills and required tech stack.",
      "What should I focus on for an upcoming Software Engineer campus drive?",
      "How do I customize my profile for a Data Analyst role?",
    ],
    actionText: "Match Job JD",
    systemPrompt: `You are the Job Match Agent AI. Analyze job descriptions and highlight exact matching skills vs missing requirements.`,
  },
  {
    id: "application-coach",
    name: "Application Coach AI",
    roleTitle: "Referral Outreach & Application Drive Tracker",
    iconName: "Send",
    purpose: "Teaches effective LinkedIn referral outreach, cold email templates for recruiters, and campus drive tracking tactics.",
    recommendedFocus: "Cold outreach templates, referral strategy, and application tracking",
    suggestedPrompts: [
      "Draft a polite LinkedIn message asking a software engineer for a job referral.",
      "How should I follow up with a campus placement recruiter after an interview?",
      "What is the best way to track my active placement applications?",
    ],
    actionText: "Outreach Strategy",
    systemPrompt: `You are the Application Coach AI. Help students request job referrals, craft recruiter messages, and track application pipelines.`,
  },
  {
    id: "communication-coach",
    name: "Communication Coach AI",
    roleTitle: "Spoken Technical Presentation Coach",
    iconName: "Mic",
    purpose: "Improves clarity, verbal confidence, and presentation skills when explaining code or handling pressure in interviews.",
    recommendedFocus: "Clarity of expression, active listening, and technical articulation",
    suggestedPrompts: [
      "How can I sound more confident when answering questions I don't know?",
      "Give me tips for presenting a technical project in a Group Discussion.",
      "How do I structure a 2-minute self-introduction for campus placements?",
    ],
    actionText: "Practice Speaking",
    systemPrompt: `You are the Communication Coach AI. Coach students on verbal confidence, clear self-introductions, and articulate technical explanations.`,
  },
];

export function getAgentById(id: string): AIAgentDefinition {
  return AI_AGENTS.find((a) => a.id === id) || AI_AGENTS[0];
}
