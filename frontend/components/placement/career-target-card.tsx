'use client'

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle2, RefreshCw } from "lucide-react";

interface CareerTargetCardProps {
  targetRole: string;
  onRoleChange?: (newRole: string) => void;
}

const CAREER_ROLES = [
  "Software Engineer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist / AI Engineer",
  "DevOps / Cloud Engineer",
  "Product Manager",
];

export function CareerTargetCard({ targetRole, onRoleChange }: CareerTargetCardProps) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(targetRole);

  const roleDetails: Record<string, { coreSkills: string[]; interviewType: string; preparationPath: string }> = {
    "Software Engineer": {
      coreSkills: ["Data Structures & Algorithms", "System Design", "SQL & DBMS", "Git & OOP"],
      interviewType: "Coding Screening + System Architecture + Technical Defense + HR",
      preparationPath: "Algorithmic problem solving & production project evidence",
    },
    "Full Stack Developer": {
      coreSkills: ["Frontend (React/Next)", "Backend (Node/Python)", "REST/GraphQL APIs", "SQL/NoSQL"],
      interviewType: "Live Coding Round + Full Stack Project Review + Technical Architecture",
      preparationPath: "End-to-end full stack deployment & API integration proof",
    },
    "Data Analyst": {
      coreSkills: ["Advanced SQL", "Python (Pandas/NumPy)", "Excel & Tableau/Power BI", "Statistics"],
      interviewType: "SQL Case Study + Data Analysis Test + Business Insights Review",
      preparationPath: "Exploratory data analysis projects & complex SQL query fluency",
    },
    "Data Scientist / AI Engineer": {
      coreSkills: ["Machine Learning", "Python/PyTorch", "Applied Math & Stats", "Feature Engineering"],
      interviewType: "ML Theory + Coding Challenge + Model Evaluation & Defense",
      preparationPath: "ML pipeline implementation & algorithmic model optimization",
    },
    "DevOps / Cloud Engineer": {
      coreSkills: ["Docker & Kubernetes", "CI/CD Pipelines", "Linux & Shell", "AWS/GCP & Terraform"],
      interviewType: "Infrastructure Case Study + Linux Hands-on + Cloud Architecture",
      preparationPath: "Containerized deployment pipelines & cloud infrastructure automation",
    },
    "Product Manager": {
      coreSkills: ["Product Sense & Metrics", "User Wireframing", "Agile & SQL", "Market Strategy"],
      interviewType: "Product Design Case + Analytical Estimation + Behavioral Strategy",
      preparationPath: "Product teardowns, roadmap execution, and metric analysis",
    },
  };

  const currentDetails = roleDetails[targetRole] || roleDetails["Software Engineer"];

  function handleSaveRole() {
    if (onRoleChange) {
      onRoleChange(selectedRole);
    }
    setOpenModal(false);
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Target Career Goal
              </p>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{targetRole}</h2>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => setOpenModal(true)}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Change Goal
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3.5 border border-gray-200/60 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Core Required Skills</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {currentDetails.coreSkills.map((s) => (
                <span key={s} className="rounded bg-white dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3.5 border border-gray-200/60 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Interview Evaluation</p>
            <p className="mt-2 text-xs font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{currentDetails.interviewType}</p>
          </div>

          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3.5 border border-gray-200/60 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Preparation Strategy</p>
            <p className="mt-2 text-xs font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{currentDetails.preparationPath}</p>
          </div>
        </div>
      </div>

      {openModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Your Target Career Goal</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Changing your goal dynamically recalculates your skill priorities, readiness thresholds, and roadmap.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {CAREER_ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left text-sm font-semibold transition ${
                    selectedRole === role
                      ? "border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>{role}</span>
                  {selectedRole === role ? <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : null}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-4">
              <Button variant="ghost" size="sm" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveRole}>
                Update Target Goal
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
