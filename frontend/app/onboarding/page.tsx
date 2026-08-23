'use client'

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Plus, Sparkles, X, GraduationCap, Target, Award, Code2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

const PREDEFINED_SKILLS = [
  "Java",
  "JavaScript",
  "TypeScript",
  "Python",
  "C",
  "C++",
  "React",
  "Next.js",
  "Node.js",
  "SQL",
  "MongoDB",
  "Git",
  "GitHub",
  "Docker",
  "AWS",
  "HTML",
  "CSS",
];

const PROFICIENCY_LEVELS = ["Below Average", "Average", "Good", "Perfect"] as const;
type SkillLevel = typeof PROFICIENCY_LEVELS[number];

const TARGET_CAREER_OPTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Java Developer",
  "Python Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "UI/UX Designer",
  "Software Engineer",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentData, setStudentData] = useState<any>(null);

  // Form State
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<Record<string, SkillLevel>>({});
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [customTargetRole, setCustomTargetRole] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/student/me");
      setStudentData(res.data);

      if (res.data.onboarding_completed) {
        router.push("/dashboard");
        return;
      }

      if (res.data.year) setYear(res.data.year);
      if (res.data.branch) setBranch(res.data.branch);
      if (res.data.cgpa) setCgpa(String(res.data.cgpa));
      if (res.data.target_role) setTargetRole(res.data.target_role);

      if (res.data.skills_with_levels && res.data.skills_with_levels.length > 0) {
        const skillsArr: string[] = [];
        const levelsObj: Record<string, SkillLevel> = {};
        res.data.skills_with_levels.forEach((item: any) => {
          if (item.skill) {
            skillsArr.push(item.skill);
            levelsObj[item.skill] = item.level || "Good";
          }
        });
        setSelectedSkills(skillsArr);
        setSkillLevels(levelsObj);
      } else if (res.data.skills && res.data.skills.length > 0) {
        setSelectedSkills(res.data.skills);
        const levelsObj: Record<string, SkillLevel> = {};
        res.data.skills.forEach((s: string) => {
          levelsObj[s] = "Good";
        });
        setSkillLevels(levelsObj);
      }
    } catch (err) {
      console.error("Failed to load profile for onboarding:", err);
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleToggleSkill = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;

    if (selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => prev.filter((s) => s !== trimmed));
      setSkillLevels((prev) => {
        const copy = { ...prev };
        delete copy[trimmed];
        return copy;
      });
    } else {
      setSelectedSkills((prev) => [...prev, trimmed]);
      setSkillLevels((prev) => ({ ...prev, [trimmed]: "Good" }));
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;

    if (!selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => [...prev, trimmed]);
      setSkillLevels((prev) => ({ ...prev, [trimmed]: "Good" }));
    }
    setCustomSkillInput("");
  };

  const handleSetSkillLevel = (skillName: string, level: SkillLevel) => {
    setSkillLevels((prev) => ({ ...prev, [skillName]: level }));
  };

  const validateStep1 = () => {
    if (!year) return "Please select your academic year.";
    if (!branch) return "Please select your branch.";
    const val = parseFloat(cgpa);
    if (isNaN(val) || val < 0 || val > 10) return "Please enter a valid CGPA between 0 and 10.";
    return null;
  };

  const validateStep2 = () => {
    if (selectedSkills.length === 0) return "Please select or add at least one technical skill.";
    return null;
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleSubmitOnboarding = async () => {
    setIsLoading(true);
    setError("");

    try {
      const finalRole = targetRole === "Other" && customTargetRole.trim() ? customTargetRole.trim() : targetRole;
      const skillsWithLevels = selectedSkills.map((s) => ({
        skill: s,
        level: skillLevels[s] || "Good",
      }));

      await api.put("/api/student/onboarding", {
        year,
        branch,
        cgpa: parseFloat(cgpa),
        skills: selectedSkills,
        skills_with_levels: skillsWithLevels,
        target_role: finalRole,
      });

      // Auto-trigger PRS calculation in the background (don't block navigation)
      api.post('/api/student/calculate-prs').catch(() => {});

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Onboarding submission error:", err);
      setError(err.response?.data?.detail || "Failed to save profile onboarding. Please try again.");
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const activeTargetRole = targetRole === "Other" && customTargetRole.trim() ? customTargetRole.trim() : targetRole;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-4 sm:p-6 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-2xl">
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden ring-1 ring-white/50">
          {/* Header & Step Indicator */}
          <CardHeader className="space-y-4 text-center border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50 pt-8 pb-6">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="h-7 w-7 text-white" />
            </div>

            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome, {studentData?.name || "Student"}! 👋
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">
                Complete your CampusIQ placement profile to personalize your career roadmap
              </CardDescription>
            </div>

            {/* Step Progress Bar */}
            <div className="flex items-center justify-between max-w-md mx-auto pt-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      step >= s
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > s ? "✓" : s}
                  </div>
                  {s < 4 ? (
                    <div
                      className={`h-1 w-12 sm:w-16 rounded-full transition-all ${
                        step > s ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* STEP 1: Academic Details */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
                    <GraduationCap className="h-5 w-5" />
                    <span>Step 1: Academic Background</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="year" className="font-semibold text-gray-700">
                        Pass Out Year
                      </Label>
                      <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                          <SelectValue placeholder="Select Pass Out Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024">2024 (Passed Out)</SelectItem>
                          <SelectItem value="2025">2025 (Passed Out / Batch 2025)</SelectItem>
                          <SelectItem value="2026">2026 (Final Year)</SelectItem>
                          <SelectItem value="2027">2027 (Third Year)</SelectItem>
                          <SelectItem value="2028">2028 (Second Year)</SelectItem>
                          <SelectItem value="Passed Out">Passed Out</SelectItem>
                          <SelectItem value="FINAL">Final Year (FINAL)</SelectItem>
                          <SelectItem value="TY">Third Year (TY)</SelectItem>
                          <SelectItem value="SY">Second Year (SY)</SelectItem>
                          <SelectItem value="FY">First Year (FY)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branch" className="font-semibold text-gray-700">
                        Branch / Department
                      </Label>
                      <Select value={branch} onValueChange={setBranch}>
                        <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CSE">CSE</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="ECE">ECE</SelectItem>
                          <SelectItem value="EEE">EEE</SelectItem>
                          <SelectItem value="MECH">MECH</SelectItem>
                          <SelectItem value="CIVIL">CIVIL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cgpa" className="font-semibold text-gray-700">
                      Current CGPA (out of 10.0)
                    </Label>
                    <Input
                      id="cgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g. 8.5"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      className="h-12 border-gray-200 rounded-xl"
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Technical Skills */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
                      <Code2 className="h-5 w-5" />
                      <span>Step 2: What skills do you have?</span>
                    </div>
                    <Badge variant="outline" className="font-semibold text-xs border-blue-200 text-blue-600">
                      {selectedSkills.length} Skills Selected
                    </Badge>
                  </div>

                  {/* Predefined Skill Selector Chips */}
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_SKILLS.map((skill) => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleToggleSkill(skill)}
                          className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {skill} {isSelected ? "✓" : "+"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Skill Form */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Input
                      placeholder="Add custom skill (e.g. GraphQL, Tailwind, Kotlin)"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomSkill();
                        }
                      }}
                      className="h-11 text-xs border-gray-200 rounded-xl"
                    />
                    <Button type="button" onClick={handleAddCustomSkill} variant="outline" className="h-11 px-4 text-xs font-semibold">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Skill Proficiency & Target Role */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
                    <Award className="h-5 w-5" />
                    <span>Step 3: Specify Proficiency & Target Career</span>
                  </div>

                  {/* Skill Proficiency List */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    <Label className="font-semibold text-xs text-gray-500 uppercase tracking-wider">
                      Rate Your Proficiency Level for Selected Skills:
                    </Label>

                    {selectedSkills.map((skill) => (
                      <div
                        key={skill}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50/50"
                      >
                        <span className="font-bold text-sm text-gray-900">{skill}</span>

                        <div className="flex items-center gap-1.5 overflow-x-auto">
                          {PROFICIENCY_LEVELS.map((lvl) => {
                            const active = (skillLevels[skill] || "Good") === lvl;
                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => handleSetSkillLevel(skill, lvl)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                  active
                                    ? lvl === "Below Average"
                                      ? "bg-amber-500 text-white"
                                      : lvl === "Average"
                                      ? "bg-blue-500 text-white"
                                      : lvl === "Good"
                                      ? "bg-indigo-600 text-white"
                                      : "bg-emerald-600 text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {lvl}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Target Career Selection */}
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <Label htmlFor="targetRole" className="font-semibold text-gray-700 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      Target Career Goal
                    </Label>
                    <Select value={targetRole} onValueChange={setTargetRole}>
                      <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                        <SelectValue placeholder="Select Target Career Goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_CAREER_OPTIONS.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    {targetRole === "Other" ? (
                      <Input
                        placeholder="Enter custom career goal (e.g. Cyber Security Analyst)"
                        value={customTargetRole}
                        onChange={(e) => setCustomTargetRole(e.target.value)}
                        className="mt-2 h-11 border-gray-200 rounded-xl"
                      />
                    ) : null}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Review & Final Confirmation */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 text-center"
                >
                  <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">You're ready!</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Review your profile choices before entering your CampusIQ Dashboard.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5 text-left space-y-4 text-xs">
                    <div>
                      <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Academic Profile:</span>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {branch} • {year} • CGPA {cgpa}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Target Career Goal:</span>
                      <p className="font-bold text-blue-600 text-sm mt-0.5">{activeTargetRole}</p>
                    </div>

                    <div>
                      <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Your Skills & Levels:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSkills.map((s) => (
                          <Badge key={s} variant="secondary" className="px-2.5 py-1 text-xs">
                            {s} — <strong className="ml-1 text-blue-600">{skillLevels[s] || "Good"}</strong>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Alert */}
            {error ? (
              <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200 text-red-700 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Validation Error</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>

          {/* Card Footer Action Buttons */}
          <CardFooter className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-6">
            {step > 1 ? (
              <Button
                variant="outline"
                type="button"
                onClick={() => setStep((prev) => prev - 1)}
                disabled={isLoading}
                className="rounded-xl px-5"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmitOnboarding}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-blue-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Profile...
                  </>
                ) : (
                  <>
                    Continue to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
