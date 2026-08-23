"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Cpu, Sparkles, CheckCircle2, Play, Send } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export function AgenticCopilot() {
  const [activeTab, setActiveTab] = useState<"strategy" | "interview">("strategy");
  const [loading, setLoading] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const [agentResult, setAgentResult] = useState<any>(null);

  const handleExecuteAgent = async (overrideMode?: "chat" | "mock_interview") => {
    const mode = overrideMode || (activeTab === "interview" ? "mock_interview" : "chat");
    setLoading(true);
    try:
      const payload = {
        agent_id: activeTab === "interview" ? "interview-coach" : "career-strategist",
        message: userQuery || "Execute placement readiness strategy analysis",
        mode: mode,
        interview_step: currentStep,
        answer_text: mode === "mock_interview" ? interviewAnswer : "",
      };

      const res = await api.post("/api/student/agent/execute", payload);
      if (res.data?.success) {
        setAgentResult(res.data.result);
        if (mode === "mock_interview" && res.data.result.next_step !== undefined) {
          setCurrentStep(res.data.result.next_step);
          setInterviewAnswer("");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Agent execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-neutral-800 bg-neutral-900/80 backdrop-blur-md shadow-2xl text-white">
      <CardHeader className="border-b border-neutral-800 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Agentic Placement Co-Pilot
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  Multi-Step AI Agent
                </Badge>
              </CardTitle>
              <p className="text-xs text-neutral-400">
                Autonomous reasoning agent executing tools across database benchmarks and interview rubrics
              </p>
            </div>
          </div>

          <div className="flex gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <Button
              size="sm"
              variant={activeTab === "strategy" ? "secondary" : "ghost"}
              className="text-xs h-8"
              onClick={() => {
                setActiveTab("strategy");
                setAgentResult(null);
              }}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Strategy Agent
            </Button>
            <Button
              size="sm"
              variant={activeTab === "interview" ? "secondary" : "ghost"}
              className="text-xs h-8"
              onClick={() => {
                setActiveTab("interview");
                setAgentResult(null);
                handleExecuteAgent("mock_interview");
              }}
            >
              <Cpu className="h-3.5 w-3.5 mr-1" />
              STAR Mock Interviewer
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Tool Execution Badges Bar */}
        <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral-400 font-medium">Registered Tools:</span>
          <Badge className="bg-neutral-800 text-indigo-300 font-mono">fetch_student_context</Badge>
          <Badge className="bg-neutral-800 text-indigo-300 font-mono">search_company_benchmarks</Badge>
          <Badge className="bg-neutral-800 text-indigo-300 font-mono">evaluate_interview_answer</Badge>
          <Badge className="bg-neutral-800 text-indigo-300 font-mono">update_roadmap_action</Badge>
        </div>

        {activeTab === "strategy" ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask agent: 'What gaps should I fix for Google SDE?' or 'How do I reach Tier-1 benchmarks?'"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-sm text-white resize-none h-16"
              />
              <Button
                disabled={loading}
                onClick={() => handleExecuteAgent("chat")}
                className="bg-indigo-600 hover:bg-indigo-500 h-16 px-5"
              >
                {loading ? <Cpu className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>

            {/* Agent Reasoning Trace Output */}
            {agentResult && (
              <div className="space-y-4 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Agent Reasoning Trace Logs
                  </h4>
                  <div className="space-y-1.5 font-mono text-xs">
                    {agentResult.reasoning_trace?.map((trace: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-neutral-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="text-indigo-400">Step {trace.step}:</span>
                        <span className="text-amber-300 font-semibold">[{trace.tool}]</span>
                        <span>{trace.action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Synthesized Agent Response
                  </h4>
                  <div className="text-sm text-neutral-200 whitespace-pre-line leading-relaxed">
                    {agentResult.response}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* STAR Mock Interviewer Interface */}
            {agentResult?.current_question && (
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                    Practice Question {currentStep + 1}
                  </Badge>
                  <span className="text-xs text-neutral-400 font-mono">STAR Rubric Engine</span>
                </div>
                <p className="text-sm font-medium text-white">{agentResult.current_question}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">
                Your Answer (Use Situation, Task, Action, Result framework):
              </label>
              <Textarea
                placeholder="During my 3rd year project, I was tasked with building an API. I implemented FastAPI and Redis which improved throughput by 40%..."
                value={interviewAnswer}
                onChange={(e) => setInterviewAnswer(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-sm text-white resize-none h-28"
              />
            </div>

            <Button
              disabled={loading || !interviewAnswer.trim()}
              onClick={() => handleExecuteAgent("mock_interview")}
              className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold"
            >
              {loading ? (
                <Cpu className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Submit Answer for Agent Evaluation & STAR Scoring
            </Button>

            {/* Evaluation Results */}
            {agentResult?.eval_result && (
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-400">STAR Score</span>
                  <span className="text-base font-bold text-emerald-400">
                    {agentResult.eval_result.star_score} / 100
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className={`p-2 rounded border ${agentResult.eval_result.star_breakdown?.situation_present ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
                    Situation
                  </div>
                  <div className={`p-2 rounded border ${agentResult.eval_result.star_breakdown?.task_present ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
                    Task
                  </div>
                  <div className={`p-2 rounded border ${agentResult.eval_result.star_breakdown?.action_present ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
                    Action
                  </div>
                  <div className={`p-2 rounded border ${agentResult.eval_result.star_breakdown?.result_present ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
                    Result
                  </div>
                </div>

                <p className="text-xs text-neutral-300 pt-2 border-t border-neutral-800">
                  <span className="font-semibold text-amber-400">Agent Feedback:</span> {agentResult.eval_result.feedback}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
