import { z } from "zod";

export const onboardingSchema = z.object({
  year: z.string().min(1, "Please select your academic year"),
  branch: z.string().min(1, "Please select your engineering branch"),
  cgpa: z.number().min(0, "CGPA must be at least 0").max(10, "CGPA cannot exceed 10"),
  target_role: z.string().min(2, "Target role is required"),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  skills_with_levels: z.array(
    z.object({
      name: z.string(),
      level: z.enum(["Beginner", "Intermediate", "Advanced"]),
    })
  ),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  year: z.string().optional(),
  branch: z.string().optional(),
  cgpa: z.number().min(0).max(10).optional(),
  skills: z.array(z.string()).optional(),
  linkedin_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  github_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const agentQuerySchema = z.object({
  agent_id: z.string(),
  message: z.string().min(1, "Message cannot be empty"),
  mode: z.enum(["chat", "mock_interview"]).optional(),
  interview_step: z.number().optional(),
  answer_text: z.string().optional(),
});

export type AgentQueryValues = z.infer<typeof agentQuerySchema>;
