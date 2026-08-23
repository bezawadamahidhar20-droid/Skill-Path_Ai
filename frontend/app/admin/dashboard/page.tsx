'use client'

import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts'
import { Loader2, Sparkles, TrendingUp, Users, AlertTriangle, CheckCircle, Bot, Grid3X3, Download, Search } from 'lucide-react'

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [skillsData, setSkillsData] = useState<any[]>([])
    const [recommendations, setRecommendations] = useState<any>(null)
    const [loadingStats, setLoadingStats] = useState(true)
    const [loadingAI, setLoadingAI] = useState(false)
    const [heatmapData, setHeatmapData] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [studentSearch, setStudentSearch] = useState('')
    const [loadingStudents, setLoadingStudents] = useState(false)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoadingStats(true)
        try {
            const [summaryRes, skillsRes] = await Promise.all([
                api.get('/api/admin/dashboard/summary'),
                api.get('/api/admin/skills-analytics')
            ])
            setStats(summaryRes.data)
            setSkillsData(skillsRes.data.top_skills)
            // Fetch heatmap data
            try {
                const heatmapRes = await api.get('/api/admin/dashboard/heatmap')
                setHeatmapData(heatmapRes.data.heatmap || [])
            } catch (e) { /* heatmap is optional */ }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
        } finally {
            setLoadingStats(false)
        }
    }

    const generateRecommendations = async () => {
        setLoadingAI(true)
        try {
            const res = await api.post('/api/admin/ai-recommendations')
            setRecommendations(res.data)
        } catch (error) {
            console.error("Failed to generate recommendations:", error)
        } finally {
            setLoadingAI(false)
        }
    }

    if (loadingStats) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_students || 0}</div>
                        <p className="text-xs text-muted-foreground">Registered on platform</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average PRS</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.avg_prs || 0}</div>
                        <p className="text-xs text-muted-foreground">Placement Readiness Score</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Risk (Red)</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats?.red_count || 0}</div>
                        <p className="text-xs text-muted-foreground">Students requiring attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Job Ready (Green)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats?.green_count || 0}</div>
                        <p className="text-xs text-muted-foreground">Eligible for placements</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Top Skills Distribution</CardTitle>
                        <CardDescription>Most common skills across all batches</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={skillsData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="skill"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="count" fill="#adfa1d" radius={[4, 4, 0, 0]}>
                                        {skillsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#60a5fa'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* AI Insights Section */}
                <Card className="col-span-3 border-l-4 border-l-purple-500 bg-purple-50/10 dark:bg-purple-900/10">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-purple-600" /> AI Insights</CardTitle>
                            <Button
                                size="sm"
                                onClick={generateRecommendations}
                                disabled={loadingAI}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {loadingAI ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                Analyze
                            </Button>
                        </div>
                        <CardDescription>
                            Generate Groq-powered training recommendations for specific batches.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!recommendations ? (
                            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                <Bot className="h-8 w-8 mb-2 opacity-50" />
                                <p>Click "Analyze" to generate insights</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                    <h4 className="font-semibold text-sm mb-1 text-purple-700 dark:text-purple-400">Analysis Summary</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{recommendations.analysis_summary}</p>
                                </div>
                                <h4 className="font-semibold text-sm mt-2">Recommended Interventions:</h4>
                                {recommendations.recommendations?.map((rec: any, idx: number) => (
                                    <div key={idx} className="p-3 border rounded-lg bg-white dark:bg-gray-800 border-l-4 border-l-blue-500 shadow-sm relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-1">
                                            <h5 className="font-bold text-sm">{rec.action_title}</h5>
                                            <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'} className="text-[10px]">
                                                {rec.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 mb-2">Target: {rec.target_batch}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{rec.reason}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Readiness Heatmap (Branch × Year) */}
            {heatmapData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Grid3X3 className="mr-2 h-5 w-5 text-blue-600" /> Readiness Heatmap (Branch × Year)
                        </CardTitle>
                        <CardDescription>Average PRS scores across branches and academic years</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Branch \ Year</th>
                                        {[...new Set(heatmapData.map((d: any) => d.year))].sort().map((year: any) => (
                                            <th key={year} className="px-4 py-2 text-center font-semibold text-gray-700">{year}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...new Set(heatmapData.map((d: any) => d.branch))].sort().map((branch: any) => (
                                        <tr key={branch}>
                                            <td className="px-4 py-2 font-medium text-gray-900 border-t border-gray-100">{branch}</td>
                                            {[...new Set(heatmapData.map((d: any) => d.year))].sort().map((year: any) => {
                                                const cell = heatmapData.find((d: any) => d.branch === branch && d.year === year)
                                                const avgPrs = cell ? cell.avg_prs : null
                                                const bgColor = avgPrs === null ? 'bg-gray-50' : avgPrs >= 70 ? 'bg-green-100 text-green-800' : avgPrs >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                return (
                                                    <td key={year} className={`px-4 py-2 text-center border-t border-gray-100 ${bgColor}`}>
                                                        {avgPrs !== null ? (
                                                            <span className="font-bold">{avgPrs}</span>
                                                        ) : (
                                                            <span className="text-gray-300">—</span>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Student Directory */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center">
                                <Users className="mr-2 h-5 w-5 text-blue-600" /> Student Directory
                            </CardTitle>
                            <CardDescription>Searchable list of all registered students</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, branch..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    setLoadingStudents(true)
                                    try {
                                        const res = await api.get('/api/admin/students/summary')
                                        setStudents(res.data.students || [])
                                    } catch (e) { console.error(e) }
                                    setLoadingStudents(false)
                                }}
                                disabled={loadingStudents}
                            >
                                {loadingStudents ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Load Students
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {students.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm font-medium">Click "Load Students" to view the student directory</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Branch</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Year</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">CGPA</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">PRS</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Skills</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students
                                        .filter((s: any) => {
                                            if (!studentSearch) return true
                                            const q = studentSearch.toLowerCase()
                                            return (
                                                (s.name || '').toLowerCase().includes(q) ||
                                                (s.email || '').toLowerCase().includes(q) ||
                                                (s.branch || '').toLowerCase().includes(q) ||
                                                (s.year || '').toLowerCase().includes(q)
                                            )
                                        })
                                        .map((s: any, idx: number) => (
                                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                                                <td className="px-4 py-3 text-gray-600">{s.email}</td>
                                                <td className="px-4 py-3"><Badge variant="outline">{s.branch || '—'}</Badge></td>
                                                <td className="px-4 py-3 text-gray-600">{s.year || '—'}</td>
                                                <td className="px-4 py-3 font-medium">{s.cgpa || '—'}</td>
                                                <td className="px-4 py-3">
                                                    {s.prs_score > 0 ? (
                                                        <span className={`font-bold ${s.prs_score >= 70 ? 'text-green-600' : s.prs_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            {s.prs_score}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {(s.skills || []).slice(0, 3).map((skill: string, i: number) => (
                                                            <Badge key={i} variant="secondary" className="text-[10px]">{skill}</Badge>
                                                        ))}
                                                        {(s.skills || []).length > 3 && (
                                                            <span className="text-xs text-gray-400">+{(s.skills || []).length - 3}</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {students.filter((s: any) => {
                                if (!studentSearch) return true
                                const q = studentSearch.toLowerCase()
                                return (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.branch || '').toLowerCase().includes(q)
                            }).length === 0 && (
                                <p className="text-center text-gray-500 py-6 text-sm">No students match "{studentSearch}"</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
