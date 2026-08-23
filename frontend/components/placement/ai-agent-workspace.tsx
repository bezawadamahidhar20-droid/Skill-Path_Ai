'use client'

import React, { useState, useEffect, useRef } from "react";
import { AI_AGENTS, getAgentById } from "@/lib/agents/definitions";
import type { AgentContext } from "@/lib/agents/context";
import { Button } from "@/components/ui/button";
import { Bot, Send, X, PlusCircle, CheckCircle2, Sparkles } from "lucide-react";

interface AIAgentWorkspaceProps {
  initialAgentId: string | null;
  userContext: AgentContext;
  onClose: () => void;
  onAddTaskToRoadmap?: (task: { title: string; category: string; description: string }) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  recommendedTask?: {
    title: string;
    category: string;
    description: string;
  } | null;
}

function getInitialMessage(agentId: string, userName: string, targetRole: string): ChatMessage {
  const agent = getAgentById(agentId);
  const firstName = userName ? userName.split(" ")[0] : "Student";
  return {
    id: "init",
    sender: "agent",
    text: `Hello ${firstName}! I am your **${agent.name}**. How can I help you prepare for your target role as a **${targetRole}** today?`,
  };
}

export function AIAgentWorkspace({
  initialAgentId,
  userContext,
  onClose,
  onAddTaskToRoadmap,
}: AIAgentWorkspaceProps) {
  const [activeAgentId, setActiveAgentId] = useState(initialAgentId || "career-strategist");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    getInitialMessage(initialAgentId || "career-strategist", userContext.userName, userContext.targetRole),
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addedTaskTitles, setAddedTaskTitles] = useState<Set<string>>(new Set());

  const activeAgent = getAgentById(activeAgentId);
  const chatEndRef = useRef<HTMLDivElement>(null);

  function handleSelectAgent(newAgentId: string) {
    if (newAgentId === activeAgentId) return;
    setActiveAgentId(newAgentId);
    setMessages([getInitialMessage(newAgentId, userContext.userName, userContext.targetRole)]);
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSendMessage(promptText?: string) {
    const textToSend = promptText || input;
    if (!textToSend.trim() || loading) return;

    const userMsgId = `user-msg-${messages.length + 1}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInput("");
    setLoading(true);

    try {
      // Simulate intelligent agent response locally based on role context & query
      await new Promise((r) => setTimeout(r, 600));

      const agentMsgId = `agent-msg-${messages.length + 2}`;
      let replyText = "";
      let recTask: { title: string; category: string; description: string } | null = null;

      const lower = textToSend.toLowerCase();

      if (activeAgent.id === "dsa-coach") {
        replyText = `**${activeAgent.name}**: For a **${userContext.targetRole}** role, focus on core algorithmic patterns:\n\n1. **Two Pointers & Sliding Window** for array optimization.\n2. **Breadth-First Search (BFS)** for shortest path grid/graph problems.\n3. **Hash Maps** for O(1) lookups.\n\nAlways state your time complexity (O(N)) before implementation!`;
        if (lower.includes("task") || lower.includes("roadmap") || lower.includes("practice")) {
          recTask = {
            title: "Master Array & Sliding Window Patterns",
            category: "Proof of Skill",
            description: "Solve 5 guided Two-Pointer / Sliding Window problems.",
          };
        }
      } else if (activeAgent.id === "resume-agent") {
        replyText = `**${activeAgent.name}**: To pass ATS filters for **${userContext.targetRole}**:\n\n- Start bullet points with strong action verbs (e.g., *Architected*, *Engineered*, *Optimized*).\n- Quantify results (e.g., *Reduced API response time by 40%*).\n- Include core tech stack keywords.`;
        recTask = {
          title: "Refine Project Bullet Points for ATS Compliance",
          category: "Resume & Portfolio",
          description: "Rewrite project descriptions using action verbs and measurable metrics.",
        };
      } else if (activeAgent.id === "interview-coach") {
        replyText = `**${activeAgent.name}**: For technical & behavioral interview rounds, structure your answers using the **STAR Method**:\n- **Situation**: Context of the problem\n- **Task**: Your specific responsibility\n- **Action**: Engineering decisions and code implementation\n- **Result**: Quantifiable output or technical lesson learned`;
        recTask = {
          title: "Prepare Structured Project Defense Answers",
          category: "Interview Preparation",
          description: "Prepare 3-minute explanations for project architecture tradeoffs.",
        };
      } else {
        replyText = `**${activeAgent.name}**: Based on your target goal as a **${userContext.targetRole}** (Current score: ${userContext.readinessScore}/100), structure your daily practice into 3 steps: 1) Concept audit, 2) Hands-on project evidence, 3) Mock interview defense.`;
        recTask = {
          title: `Targeted Action: ${activeAgent.recommendedFocus}`,
          category: "Skill Development",
          description: `Complete focused practice recommended by ${activeAgent.name}.`,
        };
      }

      setMessages((prev) => [
        ...prev,
        {
          id: agentMsgId,
          sender: "agent",
          text: replyText,
          recommendedTask: recTask,
        },
      ]);
    } catch {
      const agentErrId = `agent-err-${messages.length + 2}`;
      setMessages((prev) => [
        ...prev,
        {
          id: agentErrId,
          sender: "agent",
          text: "I experienced a connection issue while analyzing your request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleAddRoadmap(task: { title: string; category: string; description: string }) {
    setAddedTaskTitles((prev) => new Set(prev).add(task.title));
    if (onAddTaskToRoadmap) {
      onAddTaskToRoadmap(task);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{activeAgent.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activeAgent.roleTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-md pr-2">
              {AI_AGENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleSelectAgent(a.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    activeAgentId === a.id
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {a.name.split(" ")[0]}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="grid flex-1 overflow-hidden lg:grid-cols-3">
          {/* Left Sidebar */}
          <div className="hidden lg:flex flex-col justify-between border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-5 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Agent Mission</p>
                <p className="mt-1 text-xs text-gray-800 dark:text-gray-200 leading-relaxed">{activeAgent.purpose}</p>
              </div>

              <div className="rounded-lg bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 text-xs">
                <span className="font-semibold text-blue-600 dark:text-blue-400">Target Goal:</span> {userContext.targetRole}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Suggested Prompts
                </p>
                <div className="space-y-2">
                  {activeAgent.suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-2.5 text-left text-xs font-medium text-gray-800 dark:text-gray-200 transition hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                    >
                      “{prompt}”
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center Chat */}
          <div className="flex flex-col justify-between lg:col-span-2 bg-white dark:bg-gray-900 p-4 sm:p-6 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.recommendedTask ? (
                      <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>AI Recommended Action Task</span>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white text-xs">{msg.recommendedTask.title}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {msg.recommendedTask.description}
                        </p>

                        <div className="mt-2.5">
                          {addedTaskTitles.has(msg.recommendedTask.title) ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Added to Roadmap
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddRoadmap(msg.recommendedTask!)}
                              className="text-xs border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add to My Roadmap
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  <Bot className="h-4 w-4 animate-bounce text-blue-600 dark:text-blue-400" />
                  <span>{activeAgent.name} is thinking…</span>
                </div>
              ) : null}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="mt-4 flex items-center gap-2 border-t border-gray-200 dark:border-gray-800 pt-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${activeAgent.name} a question...`}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-3.5 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-blue-600"
              />
              <Button type="submit" size="sm" disabled={!input.trim() || loading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
