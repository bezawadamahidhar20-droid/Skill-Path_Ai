'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { clearAuth, getUserRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
    TrendingUp,
    Github,
    Building2,
    Star,
    Code,
    GitBranch,
    LogOut,
    Sparkles,
    Target,
    Award,
    RefreshCw,
    Map,
    BookOpen,
    CheckCircle,
    Circle,
    ArrowRight,
    AlertCircle,
    GraduationCap,
    Trophy,
    Lightbulb
} from 'lucide-react'
import { motion } from 'framer-motion'

import { ProfileEditModal } from '@/components/profile-edit-modal'
import { DashboardCommandCenter } from '@/components/placement/dashboard-command-center'
import { getRoleSkillPriorities } from '@/lib/skill-classification'
import type { AgentContext } from '@/lib/agents/context'

// Roadmap data generator based on student profile
function generateRoadmap(studentData: any, prsData: any, githubData: any) {
    const roadmap: any[] = []

    // Always start with basics
    roadmap.push({
        id: 1,
        title: "Profile Foundation",
        description: "Complete your profile with all academic details",
        status: (studentData?.branch && studentData?.year && studentData?.cgpa) ? "completed" : "in_progress",
        icon: "🎓",
        tasks: [
            { name: "Add branch & year", done: !!studentData?.branch && !!studentData?.year },
            { name: "Add CGPA", done: !!studentData?.cgpa },
            { name: "Add key skills", done: studentData?.skills?.length > 0 },
            { name: "Add GitHub profile", done: !!studentData?.github_url },
            { name: "Add LinkedIn profile", done: !!studentData?.linkedin_url },
        ]
    })

    // GitHub Analysis
    roadmap.push({
        id: 2,
        title: "GitHub Portfolio",
        description: "Analyze and optimize your GitHub presence",
        status: githubData ? "completed" : (studentData?.github_url ? "in_progress" : "not_started"),
        icon: "💻",
        tasks: [
            { name: "Add GitHub URL to profile", done: !!studentData?.github_url },
            { name: "Run GitHub analysis", done: !!githubData },
            { name: "Maintain active repositories", done: (githubData?.activity_summary?.active_repos_last_90_days || 0) >= 2 },
            { name: "Contribute to open source", done: (githubData?.public_repos || 0) >= 5 },
        ]
    })

    // DSA & Problem Solving
    const hasDSASkills = studentData?.skills?.some((s: string) => 
        ['java', 'python', 'c++', 'dsa', 'data structures', 'algorithms'].includes(s.toLowerCase())
    )
    roadmap.push({
        id: 3,
        title: "DSA & Problem Solving",
        description: "Master data structures and algorithms for coding interviews",
        status: prsData?.breakdown?.coding_practice > 20 ? "completed" : "not_started",
        icon: "🧩",
        tasks: [
            { name: "Solve 100+ DSA problems", done: false },
            { name: "Master Arrays & Strings", done: false },
            { name: "Master Trees & Graphs", done: false },
            { name: "Practice on LeetCode/HackerRank", done: false },
            { name: "Participate in coding contests", done: false },
        ]
    })

    // Technical Skills
    roadmap.push({
        id: 4,
        title: "Technical Skills Development",
        description: "Build expertise in your domain technologies",
        status: (studentData?.skills?.length || 0) >= 5 ? "in_progress" : "not_started",
        icon: "⚡",
        tasks: [
            { name: "Master primary programming language", done: hasDSASkills },
            { name: "Learn a web framework (React/Django/Node)", done: false },
            { name: "Understand databases (SQL + NoSQL)", done: false },
            { name: "Learn version control (Git)", done: !!studentData?.github_url },
            { name: "Build 2-3 real-world projects", done: false },
        ]
    })

    // Projects & Portfolio
    roadmap.push({
        id: 5,
        title: "Projects & Portfolio",
        description: "Build impressive projects to showcase your skills",
        status: "not_started",
        icon: "🚀",
        tasks: [
            { name: "Build a full-stack web application", done: false },
            { name: "Create a personal portfolio website", done: false },
            { name: "Contribute to open-source projects", done: false },
            { name: "Document projects on GitHub", done: false },
            { name: "Add project descriptions & demos", done: false },
        ]
    })

    // Aptitude & Soft Skills
    roadmap.push({
        id: 6,
        title: "Aptitude & Soft Skills",
        description: "Prepare for aptitude tests and develop communication skills",
        status: "not_started",
        icon: "🎯",
        tasks: [
            { name: "Practice quantitative aptitude daily", done: false },
            { name: "Improve logical reasoning", done: false },
            { name: "Work on verbal ability", done: false },
            { name: "Practice mock interviews", done: false },
            { name: "Develop presentation skills", done: false },
        ]
    })

    // Resume & LinkedIn
    roadmap.push({
        id: 7,
        title: "Resume & LinkedIn Optimization",
        description: "Create a standout resume and optimize LinkedIn profile",
        status: "not_started",
        icon: "📄",
        tasks: [
            { name: "Create ATS-friendly resume", done: false },
            { name: "Upload resume for AI analysis", done: false },
            { name: "Optimize LinkedIn headline & summary", done: false },
            { name: "Get LinkedIn recommendations", done: false },
            { name: "Build professional network", done: false },
        ]
    })

    // Interview Preparation
    roadmap.push({
        id: 8,
        title: "Interview Preparation",
        description: "Prepare for technical and HR interview rounds",
        status: "not_started",
        icon: "🎙️",
        tasks: [
            { name: "Practice system design basics", done: false },
            { name: "Prepare behavioral interview answers", done: false },
            { name: "Mock technical interviews", done: false },
            { name: "Research target companies", done: false },
            { name: "Practice salary negotiation", done: false },
        ]
    })

    return roadmap
}

export default function DashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [studentData, setStudentData] = useState<any>(null)
    const [prsData, setPrsData] = useState<any>(null)
    const [githubData, setGithubData] = useState<any>(null)
    const [companyMatches, setCompanyMatches] = useState<any[]>([])
    const [companyAIAnalysis, setCompanyAIAnalysis] = useState<any>(null)
    const [analyzingPRS, setAnalyzingPRS] = useState(false)
    const [analyzingGithub, setAnalyzingGithub] = useState(false)
    const [loadingCompanyMatches, setLoadingCompanyMatches] = useState(false)
    const [targetRole, setTargetRole] = useState<string>("Software Engineer")
    const [customRoadmapTasks, setCustomRoadmapTasks] = useState<any[]>([])
    const [networkError, setNetworkError] = useState<string | null>(null)

    useEffect(() => {
        if (studentData?.target_role || (studentData?.skills && studentData.skills.length > 0)) {
            setTargetRole(studentData.target_role || studentData.skills[0])
        }
    }, [studentData])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setNetworkError(null)
        try {
            const studentRes = await api.get('/api/student/me')
            if (studentRes.data && studentRes.data.onboarding_completed === false) {
                window.location.href = '/onboarding'
                return
            }
            setStudentData(studentRes.data)
            if (studentRes.data?.target_role) {
                setTargetRole(studentRes.data.target_role)
            }

            if (studentRes.data?.prs_score !== undefined && studentRes.data.prs_score > 0) {
                setPrsData({
                    prs_score: studentRes.data.prs_score,
                    prs_level: studentRes.data.prs_level,
                    breakdown: studentRes.data.prs_breakdown
                })
            }

            if (studentRes.data?.github_analysis) {
                setGithubData(studentRes.data.github_analysis)
            }

            setLoading(false)
        } catch (error: any) {
            console.error('Dashboard data fetch error:', error)
            if (error.response && error.response.status === 401) {
                window.location.href = '/login'
                return
            }
            // Detect network error (backend not running)
            const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.message?.includes('ECONNREFUSED'));
            if (isNetworkError) {
                setNetworkError('Backend server is not running at http://localhost:8000. Please start the backend (cd backend && uvicorn app.main:app --reload) and click Retry.')
            } else if (error.response) {
                setNetworkError(`Server error ${error.response.status}: ${error.response.data?.detail || 'Something went wrong'}`)
            } else {
                setNetworkError('An unexpected error occurred. Please try again.')
            }
            setLoading(false)
        }
    }

    const handleCalculatePRS = async () => {
        setAnalyzingPRS(true)
        try {
            const res = await api.post('/api/student/calculate-prs')
            setPrsData({
                prs_score: res.data.prs_score,
                prs_level: res.data.prs_level,
                breakdown: res.data.prs_breakdown
            })
            fetchDashboardData()
        } catch (error: any) {
            console.error('PRS calculation error:', error)
            const msg = error.response?.data?.detail || "Failed to calculate PRS."
            alert(`Error: ${msg}`)
        } finally {
            setAnalyzingPRS(false)
        }
    }

    const handleAnalyzeGithub = async () => {
        setAnalyzingGithub(true)
        try {
            const res = await api.post('/api/student/analyze/github')
            setGithubData(res.data.github_analysis)
            // Auto-recalculate PRS after GitHub analysis to keep score fresh
            api.post('/api/student/calculate-prs').then((prsRes) => {
                setPrsData({
                    prs_score: prsRes.data.prs_score,
                    prs_level: prsRes.data.prs_level,
                    breakdown: prsRes.data.prs_breakdown
                })
            }).catch(() => {})
            fetchDashboardData()
        } catch (error: any) {
            console.error('GitHub analysis error:', error)
            const errorMessage = error.response?.data?.detail || 'Failed to analyze GitHub profile.'
            alert(`Error: ${errorMessage}`)
        } finally {
            setAnalyzingGithub(false)
        }
    }

    const handleCompanyLens = async () => {
        setLoadingCompanyMatches(true)
        try {
            const res = await api.get('/api/student/company-match')
            setCompanyMatches(res.data.company_matches || [])
            setCompanyAIAnalysis(res.data.ai_analysis || null)
        } catch (error) {
            console.error('Company match error:', error)
            alert('Failed to load company matches. Please try again.')
        } finally {
            setLoadingCompanyMatches(false)
        }
    }

    const handleLogout = () => {
        clearAuth()
        router.push('/login')
    }

    const getPRSColor = (score: number) => {
        if (score >= 80) return 'from-green-500 to-emerald-600'
        if (score >= 60) return 'from-blue-500 to-indigo-600'
        if (score >= 40) return 'from-yellow-500 to-orange-600'
        return 'from-red-500 to-rose-600'
    }

    const roadmap = generateRoadmap(studentData, prsData, githubData)
    const completedTasks = roadmap.filter(r => r.status === "completed").length
    const roadmapProgress = Math.round((completedTasks / roadmap.length) * 100)

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Skeleton className="h-14 w-72" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-52" />
                        <Skeleton className="h-52" />
                        <Skeleton className="h-52" />
                    </div>
                    <Skeleton className="h-80" />
                </div>
            </div>
        )
    }

    // Full-page error state when backend is unreachable
    if (networkError && !studentData?.onboarding_completed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 flex items-center justify-center">
                <div className="max-w-lg w-full text-center space-y-6">
                    <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Connection Error</h2>
                        <p className="text-gray-500 mt-2 text-sm leading-relaxed">{networkError}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-left text-xs font-mono text-gray-600 space-y-1">
                        <p className="font-bold text-gray-700">To fix this, run:</p>
                        <code className="block bg-white p-2 rounded border text-blue-600">cd backend && uvicorn app.main:app --reload --port 8000</code>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={fetchDashboardData} className="gap-2">
                            <RefreshCw className="h-4 w-4" /> Retry
                        </Button>
                        <Button variant="outline" onClick={() => { clearAuth(); router.push('/login') }}>
                            <LogOut className="h-4 w-4 mr-2" /> Logout
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const score = prsData?.prs_score || (studentData?.cgpa ? Math.round(studentData.cgpa * 10) : 75)
    const level = prsData?.prs_level || (score >= 80 ? "Perfect" : score >= 65 ? "Good" : score >= 50 ? "Average" : "Below Average")
    const prioritizedSkills = getRoleSkillPriorities(targetRole, {
        codingScore: score,
        dsa: prsData?.breakdown?.dsa ?? score,
        sqlScore: prsData?.breakdown?.sql ?? score,
        webDev: prsData?.breakdown?.web_dev ?? score,
    })

    const formattedRoadmapTasks = [
        ...roadmap.map((stage: any) => ({
            id: stage.id,
            title: stage.title,
            category: stage.title.includes("Foundation") ? "Career Strategy" : stage.title.includes("Technical") || stage.title.includes("DSA") ? "Skill Development" : stage.title.includes("Projects") || stage.title.includes("GitHub") ? "Proof of Skill" : stage.title.includes("Resume") ? "Resume & Portfolio" : stage.title.includes("Interview") ? "Interview Preparation" : "Application Strategy",
            description: stage.description,
            status: stage.status === "completed" ? ("completed" as const) : stage.status === "in_progress" ? ("in_progress" as const) : ("not_started" as const),
        })),
        ...customRoadmapTasks,
    ]

    const agentContext: AgentContext = {
        userName: studentData?.name || "Student",
        targetRole,
        readinessScore: score,
        readinessLevel: level,
        priorityGaps: prioritizedSkills
            .filter((s) => s.level === "Below Average" || s.level === "Average")
            .map((s) => ({ skill: s.name, level: s.level, priority: s.priority })),
        activeRoadmapTasks: formattedRoadmapTasks.map((t) => ({ title: t.title, category: t.category, status: t.status })),
        projectsCount: studentData?.projects?.length || 2,
        internshipsCount: studentData?.internships?.length || 0,
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4"
                >
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">
                            Welcome back, {studentData?.name || 'Student'}! 👋
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">
                            {studentData?.branch} • Year {studentData?.year} • CGPA {studentData?.cgpa}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ProfileEditModal
                            studentData={studentData}
                            onUpdate={fetchDashboardData}
                        />
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="gap-2 h-11 px-5"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </motion.div>

                {/* Network Error Banner */}
                {networkError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                    >
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-700">Connection Error</p>
                            <p className="text-xs text-red-600 mt-1">{networkError}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchDashboardData}
                            className="shrink-0 border-red-200 text-red-700 hover:bg-red-100"
                        >
                            <RefreshCw className="h-3 w-3 mr-1" /> Retry
                        </Button>
                    </motion.div>
                )}

                {/* Placement Readiness AI Command Center */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <DashboardCommandCenter
                        userName={studentData?.name || "Student"}
                        targetRole={targetRole}
                        readinessScore={score}
                        readinessLevel={level}
                        prioritizedSkills={prioritizedSkills}
                        roadmapTasks={formattedRoadmapTasks}
                        agentContext={agentContext}
                        onRoleChange={(newRole) => setTargetRole(newRole)}
                        onAddTaskToRoadmap={(newTask) =>
                            setCustomRoadmapTasks((prev) => [
                                ...prev,
                                {
                                    id: Date.now(),
                                    title: newTask.title,
                                    category: newTask.category,
                                    description: newTask.description,
                                    status: "not_started" as const,
                                },
                            ])
                        }
                    />
                </motion.div>

                {/* PRS Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl mb-8">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        <Target className="h-6 w-6 text-blue-600" />
                                        Placement Readiness Score (PRS)
                                    </CardTitle>
                                    <CardDescription className="text-base mt-1">Your overall placement readiness assessment</CardDescription>
                                </div>
                                <Button
                                    onClick={handleCalculatePRS}
                                    disabled={analyzingPRS}
                                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 px-6 text-base"
                                >
                                    {analyzingPRS ? (
                                        <>
                                            <RefreshCw className="h-5 w-5 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5" />
                                            {prsData ? 'Recalculate PRS' : 'Calculate PRS'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {prsData && prsData.prs_score > 0 ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-8">
                                        <div className={`relative w-36 h-36 rounded-full bg-gradient-to-br ${getPRSColor(prsData.prs_score)} flex items-center justify-center shadow-lg`}>
                                            <div className="absolute inset-2 rounded-full bg-white flex flex-col items-center justify-center">
                                                <span className="text-4xl font-bold text-gray-900">{prsData.prs_score}</span>
                                                <span className="text-sm text-gray-500">/ 100</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-3xl font-bold text-gray-900 mb-3">{prsData.prs_level}</h3>
                                            <Progress value={prsData.prs_score} className="h-4" />
                                            <p className="text-sm text-gray-500 mt-2">
                                                {prsData.prs_score >= 80 ? "Excellent! You're well prepared for placements." :
                                                 prsData.prs_score >= 60 ? "Good progress! Keep building your skills." :
                                                 prsData.prs_score >= 40 ? "Room for improvement. Follow your roadmap below." :
                                                 "Let's get started! Follow the roadmap below to improve."}
                                            </p>
                                        </div>
                                    </div>

                                    {prsData.breakdown && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                                            {Object.entries(prsData.breakdown).map(([key, value]: [string, any]) => (
                                                <div key={key} className="text-center p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 uppercase mb-1 font-medium">{key.replace(/_/g, ' ')}</p>
                                                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium mb-2">No PRS score yet</p>
                                    <p className="text-sm">Click "Calculate PRS" to get your placement readiness score</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Learning Roadmap */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-8"
                >
                    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        <Map className="h-6 w-6 text-indigo-600" />
                                        Your Placement Roadmap
                                    </CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        Follow this step-by-step guide to maximize your placement readiness
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-indigo-600">{roadmapProgress}%</p>
                                    <p className="text-xs text-gray-500">Complete</p>
                                </div>
                            </div>
                            <Progress value={roadmapProgress} className="h-3 mt-3" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {roadmap.map((step) => (
                                    <div
                                        key={step.id}
                                        className={`p-5 rounded-2xl border-2 transition-all ${
                                            step.status === "completed"
                                                ? "bg-green-50 border-green-200"
                                                : step.status === "in_progress"
                                                ? "bg-blue-50 border-blue-200"
                                                : "bg-gray-50 border-gray-200 hover:border-indigo-300"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="text-2xl">{step.icon}</span>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 text-base">{step.title}</h4>
                                                <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                                            </div>
                                            <Badge
                                                variant={step.status === "completed" ? "default" : "secondary"}
                                                className={
                                                    step.status === "completed"
                                                        ? "bg-green-500 text-white"
                                                        : step.status === "in_progress"
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-gray-200 text-gray-600"
                                                }
                                            >
                                                {step.status === "completed" ? "Done" : step.status === "in_progress" ? "In Progress" : "To Do"}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2 ml-11">
                                            {step.tasks.map((task: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    {task.done ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Circle className="h-4 w-4 text-gray-300" />
                                                    )}
                                                    <span className={`text-sm ${task.done ? 'text-green-700 line-through' : 'text-gray-600'}`}>
                                                        {task.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Second Row: GitHub Analysis + Company Lens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* GitHub Analysis */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl h-full">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-3 text-lg">
                                        <Github className="h-5 w-5 text-gray-900" />
                                        GitHub Analysis
                                    </CardTitle>
                                    <Button
                                        onClick={handleAnalyzeGithub}
                                        disabled={analyzingGithub || !studentData?.github_url}
                                        size="lg"
                                        className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                    >
                                        {analyzingGithub ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <GitBranch className="h-4 w-4" />
                                                Analyze GitHub
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {githubData ? (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-blue-50 p-4 rounded-xl">
                                                <Code className="h-6 w-6 text-blue-600 mb-2" />
                                                <p className="text-2xl font-bold text-gray-900">{githubData.public_repos || 0}</p>
                                                <p className="text-sm text-gray-500">Repositories</p>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-xl">
                                                <Star className="h-6 w-6 text-green-600 mb-2" />
                                                <p className="text-2xl font-bold text-gray-900">{githubData.activity_summary?.commits_last_90_days_estimated || 0}</p>
                                                <p className="text-sm text-gray-500">Commits (90d)</p>
                                            </div>
                                            <div className="bg-purple-50 p-4 rounded-xl">
                                                <GitBranch className="h-6 w-6 text-purple-600 mb-2" />
                                                <p className="text-2xl font-bold text-gray-900">{githubData.activity_summary?.active_repos_last_90_days || 0}</p>
                                                <p className="text-sm text-gray-500">Active Repos</p>
                                            </div>
                                            <div className="bg-indigo-50 p-4 rounded-xl">
                                                <TrendingUp className="h-6 w-6 text-indigo-600 mb-2" />
                                                <p className="text-2xl font-bold text-gray-900">{githubData.github_score || 0}</p>
                                                <p className="text-sm text-gray-500">GitHub Score</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-6 text-base">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">{githubData.followers || 0}</span>
                                                <span className="text-gray-500">followers</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">{githubData.following || 0}</span>
                                                <span className="text-gray-500">following</span>
                                            </div>
                                        </div>

                                        {githubData.top_languages && githubData.top_languages.length > 0 && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-2">Top Languages</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {githubData.top_languages.map((lang: string) => (
                                                        <Badge key={lang} variant="secondary" className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1">
                                                            {lang}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {githubData.project_type_distribution && Object.keys(githubData.project_type_distribution).length > 0 && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-2">Project Types</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(githubData.project_type_distribution).map(([type, count]: [string, any]) => (
                                                        <Badge key={type} variant="outline" className="px-3 py-1">
                                                            {type} ({count})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {githubData.repo_analysis && githubData.repo_analysis.length > 0 && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-3">Top Repositories</p>
                                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                                    {githubData.repo_analysis.slice(0, 5).map((repo: any, idx: number) => (
                                                        <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex-1">
                                                                    <h4 className="font-semibold text-gray-900 text-sm">{repo.repo_name}</h4>
                                                                    {repo.description && (
                                                                        <p className="text-xs text-gray-600 mt-1">{repo.description}</p>
                                                                    )}
                                                                </div>
                                                                {repo.active_in_last_90_days && (
                                                                    <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                                {repo.languages_used?.slice(0, 3).map((lang: string) => (
                                                                    <Badge key={lang} variant="outline" className="text-xs">{lang}</Badge>
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <GitBranch className="h-3 w-3" />
                                                                    {repo.commits_last_90_days_estimated || 0} commits
                                                                </span>
                                                                {repo.project_type && (
                                                                    <span className="text-blue-600">{repo.project_type}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <Github className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-base font-medium">
                                            {studentData?.github_url
                                                ? 'Click "Analyze GitHub" to get insights'
                                                : 'Add GitHub URL in your profile to analyze'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Company Lens */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl h-full">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-3 text-lg">
                                        <Building2 className="h-5 w-5 text-indigo-600" />
                                        Company Matches
                                    </CardTitle>
                                    <Button
                                        onClick={handleCompanyLens}
                                        disabled={loadingCompanyMatches}
                                        variant="outline"
                                        size="lg"
                                        className="gap-2"
                                    >
                                        {loadingCompanyMatches ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Award className="h-4 w-4" />
                                                Find Matches
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {companyMatches.length > 0 ? (
                                    <div className="space-y-5">
                                        {companyAIAnalysis && (
                                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200">
                                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                    <Sparkles className="h-5 w-5 text-purple-600" />
                                                    AI Profile Analysis
                                                </h4>
                                                {companyAIAnalysis.overall_profile_summary && (
                                                    <p className="text-sm text-gray-700 mb-3">{companyAIAnalysis.overall_profile_summary}</p>
                                                )}
                                                <div className="grid grid-cols-1 gap-3">
                                                    {companyAIAnalysis.profile_strengths?.length > 0 && (
                                                        <div className="bg-white p-3 rounded-xl">
                                                            <p className="text-xs font-semibold text-green-700 mb-2">💪 Strengths</p>
                                                            <ul className="space-y-1">
                                                                {companyAIAnalysis.profile_strengths.slice(0, 3).map((s: string, i: number) => (
                                                                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                                                        <span className="text-green-500 mt-0.5">✓</span>
                                                                        <span>{s}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {companyAIAnalysis.profile_weaknesses?.length > 0 && (
                                                        <div className="bg-white p-3 rounded-xl">
                                                            <p className="text-xs font-semibold text-orange-700 mb-2">📈 Areas to Improve</p>
                                                            <ul className="space-y-1">
                                                                {companyAIAnalysis.profile_weaknesses.slice(0, 3).map((w: string, i: number) => (
                                                                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                                                        <span className="text-orange-500 mt-0.5">→</span>
                                                                        <span>{w}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {companyMatches.map((match: any, idx: number) => {
                                                const aiInsight = companyAIAnalysis?.company_insights?.find(
                                                    (insight: any) => insight.company_name === match.company_name
                                                )
                                                return (
                                                    <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                                                        <div className="p-4 flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <p className="font-bold text-gray-900 text-base">{match.company_name}</p>
                                                                <p className="text-sm text-gray-500">
                                                                    {match.match_percent}% match • {match.role} • {match.tier}
                                                                </p>
                                                            </div>
                                                            <Badge
                                                                variant={match.eligible ? "default" : "outline"}
                                                                className={match.eligible ? "bg-green-600 text-white" : "bg-red-50 text-red-700 border-red-200"}
                                                            >
                                                                {match.eligible ? 'Eligible' : 'Not Eligible'}
                                                            </Badge>
                                                        </div>
                                                        {aiInsight && (
                                                            <div className="px-4 pb-4 space-y-2 border-t border-gray-200 pt-3 bg-white">
                                                                {aiInsight.match_reasoning && (
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-blue-700 mb-1">🎯 Why You Match:</p>
                                                                        <p className="text-xs text-gray-600">{aiInsight.match_reasoning}</p>
                                                                    </div>
                                                                )}
                                                                {aiInsight.eligibility_explanation && (
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-gray-700 mb-1">
                                                                            {match.eligible ? '✅ Eligibility:' : '❌ Not Eligible:'}
                                                                        </p>
                                                                        <p className="text-xs text-gray-600">{aiInsight.eligibility_explanation}</p>
                                                                    </div>
                                                                )}
                                                                {aiInsight.improvement_suggestions?.length > 0 && (
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-purple-700 mb-1">💡 Suggestions:</p>
                                                                        <ul className="space-y-1">
                                                                            {aiInsight.improvement_suggestions.map((s: string, i: number) => (
                                                                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                                                                    <span>•</span>
                                                                                    <span>{s}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {companyAIAnalysis?.top_priority_actions?.length > 0 && (
                                            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200">
                                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
                                                    <Target className="h-5 w-5 text-blue-600" />
                                                    Top Priority Actions
                                                </h4>
                                                <ul className="space-y-2">
                                                    {companyAIAnalysis.top_priority_actions.map((action: string, idx: number) => (
                                                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                            <span className="text-blue-600 font-bold">{idx + 1}.</span>
                                                            <span>{action}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-base font-medium">Click "Find Matches" to see company opportunities</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Skills Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-lg">
                                <Lightbulb className="h-5 w-5 text-yellow-500" />
                                Your Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                {studentData?.skills?.map((skill: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="px-4 py-2 text-sm">
                                        {skill}
                                    </Badge>
                                ))}
                                {(!studentData?.skills || studentData.skills.length === 0) && (
                                    <p className="text-gray-500">No skills added yet. Edit your profile to add skills.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
