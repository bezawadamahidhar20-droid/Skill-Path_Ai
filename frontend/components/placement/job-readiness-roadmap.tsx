'use client'

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Bot } from "lucide-react";
import api from "@/lib/api";

export interface RoadmapTaskItem {
  id: number | string;
  title: string;
  category: string;
  description: string | null;
  status: "not_started" | "in_progress" | "completed";
}

interface JobReadinessRoadmapProps {
  targetRole: string;
  tasks: RoadmapTaskItem[];
  onOpenAgent: (agentId: string) => void;
  onToggleTask?: (taskId: number | string) => void;
}

export function JobReadinessRoadmap({ targetRole, tasks, onOpenAgent, onToggleTask }: JobReadinessRoadmapProps) {
  const [localTasks, setLocalTasks] = useState<RoadmapTaskItem[]>(tasks);

  // Load saved task states from backend on mount
  useEffect(() => {
    api.get('/api/student/roadmap-tasks').then((res) => {
      const savedTasks = res.data.tasks || [];
      if (savedTasks.length > 0) {
        setLocalTasks((prev) =>
          prev.map((t) => {
            const saved = savedTasks.find((s: any) => s.task_id === String(t.id));
            return saved ? { ...t, status: saved.completed ? ("completed" as const) : t.status } : t;
          })
        );
      }
    }).catch(() => {});
  }, []);

  const stages = [
    {
      number: 1,
      title: "Stage 1 — Career Target",
      description: `Confirm target role specifications and core benchmarks for ${targetRole}.`,
      category: "Career Strategy",
      recommendedAgent: "career-strategist",
    },
    {
      number: 2,
      title: "Stage 2 — Close Critical Skill Gaps",
      description: "Focus practice on your weakest priority technical skill gaps.",
      category: "Skill Development",
      recommendedAgent: "skill-coach",
    },
    {
      number: 3,
      title: "Stage 3 — Build Proof of Skill",
      description: "Deploy production projects with clean documentation & GitHub evidence.",
      category: "Proof of Skill",
      recommendedAgent: "dsa-coach",
    },
    {
      number: 4,
      title: "Stage 4 — Resume Readiness",
      description: "Optimize project bullet points, keywords, and ATS screening structure.",
      category: "Resume & Portfolio",
      recommendedAgent: "resume-agent",
    },
    {
      number: 5,
      title: "Stage 5 — Interview Readiness",
      description: "Prepare structured STAR-method responses for Technical, HR & Behavioral rounds.",
      category: "Interview Preparation",
      recommendedAgent: "interview-coach",
    },
    {
      number: 6,
      title: "Stage 6 — Application Readiness",
      description: "Match job descriptions, request referrals, and track active placement drives.",
      category: "Application Strategy",
      recommendedAgent: "application-coach",
    },
  ];

  function handleToggle(taskId: number | string) {
    setLocalTasks((prev) => {
      const next = prev.map((t) =>
        t.id === taskId ? { ...t, status: t.status === "completed" ? ("not_started" as const) : ("completed" as const) } : t
      );
      // Persist to backend
      const toggledTask = next.find((t) => t.id === taskId);
      if (toggledTask) {
        api.post('/api/student/roadmap-tasks', {
          task_id: String(toggledTask.id),
          task_title: toggledTask.title,
          completed: toggledTask.status === "completed",
        }).catch(() => {});
      }
      return next;
    });
    if (onToggleTask) {
      onToggleTask(taskId);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-sm">
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5 mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Job-Readiness Employment Roadmap</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          A structured 6-stage timeline guiding you from skill diagnosis to placement offers.
        </p>
      </div>

      <div className="relative space-y-8 before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
        {stages.map((stage) => {
          const stageTasks = localTasks.filter(
            (t) =>
              t.category.toLowerCase().includes(stage.category.toLowerCase()) ||
              (stage.number === 1 && t.category.toLowerCase().includes("foundation"))
          );

          const completedCount = stageTasks.filter((t) => t.status === "completed").length;
          const isStageDone = stageTasks.length > 0 && completedCount === stageTasks.length;

          return (
            <div key={stage.number} className="relative pl-10">
              <div
                className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                  isStageDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-blue-600 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400"
                }`}
              >
                {isStageDone ? "✓" : stage.number}
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">{stage.title}</h4>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{stage.description}</p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenAgent(stage.recommendedAgent)}
                    className="shrink-0 text-xs hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Bot className="mr-1.5 h-3.5 w-3.5" /> Stage AI Coach
                  </Button>
                </div>

                {stageTasks.length > 0 ? (
                  <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-gray-800 pt-3">
                    {stageTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggle(task.id)}
                            className="text-gray-400 hover:text-blue-600 transition"
                          >
                            {task.status === "completed" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : task.status === "in_progress" ? (
                              <Clock className="h-4 w-4 text-amber-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          <div>
                            <span
                              className={`font-semibold ${
                                task.status === "completed" ? "line-through text-gray-400" : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.description ? (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">{task.description}</p>
                            ) : null}
                          </div>
                        </div>

                        <Badge
                          variant={task.status === "completed" ? "default" : "outline"}
                          className="shrink-0 text-[10px]"
                        >
                          {task.status === "completed"
                            ? "Completed"
                            : task.status === "in_progress"
                            ? "In Progress"
                            : "Recommended"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
                    No active tasks assigned to this stage yet. Consult the Stage AI Coach to generate custom tasks.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
