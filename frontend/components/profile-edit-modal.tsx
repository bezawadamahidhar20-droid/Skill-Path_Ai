'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Edit2, Save, User, GraduationCap, Code2, Linkedin, Github } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import api from '@/lib/api'

interface ProfileEditModalProps {
    studentData: any
    onUpdate: () => void
}

export function ProfileEditModal({ studentData, onUpdate }: ProfileEditModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: studentData?.name || '',
        year: studentData?.year || '',
        branch: studentData?.branch || '',
        cgpa: studentData?.cgpa || '',
        skills: studentData?.skills ? studentData.skills.join(', ') : '',
        linkedin_url: studentData?.linkedin_url || '',
        github_url: studentData?.github_url || ''
    })

    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [analyzingResume, setAnalyzingResume] = useState(false)
    const [resumeAnalysis, setResumeAnalysis] = useState<any>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            const maxSize = 5 * 1024 * 1024 // 5MB
            if (file.size > maxSize) {
                alert('File too large. Maximum size is 5MB. Please compress your image and try again.')
                return
            }
            setResumeFile(file)
            handleAnalyzeResume(file)
        }
    }

    const handleAnalyzeResume = async (file: File) => {
        setAnalyzingResume(true)
        try {
            const fd = new FormData()
            fd.append('file', file)

            const res = await api.post('/api/student/analyze/resume', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            setResumeAnalysis(res.data)
            alert(`Resume Analyzed! ATS Score: ${res.data.ats_score}/100`)

            // Auto-recalculate PRS after resume analysis
            api.post('/api/student/calculate-prs').catch(() => {})

            const analysisData = res.data.analysis
            if (analysisData && analysisData.skills && Array.isArray(analysisData.skills)) {
                const newSkills = analysisData.skills.join(', ')
                setFormData(prev => {
                    const currentSkills = prev.skills || ''
                    return {
                        ...prev,
                        skills: currentSkills ? `${currentSkills}, ${newSkills}` : newSkills
                    }
                })
            }
        } catch (error) {
            console.error('Resume analysis error:', error)
            alert('Failed to analyze resume. Please try again.')
        } finally {
            setAnalyzingResume(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const payload = {
                ...formData,
                cgpa: parseFloat(formData.cgpa.toString()),
                skills: typeof formData.skills === 'string'
                    ? formData.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
                    : formData.skills,
            }

            await api.put('/api/student/update', payload)
            onUpdate()
            setOpen(false)
        } catch (error) {
            console.error('Update profile error:', error)
            alert('Failed to update profile. Please check your inputs.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="hidden md:flex gap-2 h-11 px-5">
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="px-8 pt-8 pb-4">
                    <DialogTitle className="text-2xl font-bold">Edit Profile Details</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
                    {/* Resume Upload Section */}
                    <div className="p-6 border-2 border-dashed rounded-2xl bg-gray-50 text-center">
                        <Label htmlFor="resume" className="cursor-pointer block">
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                    {analyzingResume ? <Loader2 className="h-8 w-8 animate-spin" /> : <Edit2 className="h-8 w-8" />}
                                </div>
                                <span className="text-base font-medium text-gray-700">
                                    {analyzingResume ? "Analyzing Resume..." : "Upload Resume Image for AI Analysis"}
                                </span>
                                <span className="text-sm text-gray-500">
                                    Upload an image of your resume to auto-extract skills and get an ATS score.
                                </span>
                            </div>
                            <Input
                                id="resume"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                                disabled={analyzingResume}
                            />
                        </Label>
                        {resumeAnalysis && (
                            <div className="mt-4 text-sm text-left bg-green-50 p-4 rounded-xl border border-green-100">
                                <p className="font-semibold text-green-700 text-base">✅ Analysis Complete</p>
                                <p className="mt-1">ATS Score: <strong className="text-lg">{resumeAnalysis.ats_score}/100</strong></p>
                                <p className="text-xs mt-1 text-gray-600">Skills extracted and added to form.</p>
                            </div>
                        )}
                    </div>

                    {/* Personal Info */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Personal Information</p>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-500" />
                                    Full Name
                                </Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleChange} required
                                    className="h-12 text-base rounded-xl" />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Academic Info */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Academic Details</p>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-blue-500" />
                                        Year
                                    </Label>
                                    <Select value={formData.year} onValueChange={(val) => handleSelectChange('year', val)}>
                                        <SelectTrigger className="h-12 text-base rounded-xl">
                                            <SelectValue placeholder="Select Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                        <SelectItem value="FY">First Year (FY)</SelectItem>
                                        <SelectItem value="SY">Second Year (SY)</SelectItem>
                                        <SelectItem value="TY">Third Year (TY)</SelectItem>
                                        <SelectItem value="FINAL">Final Year (FINAL)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                        <Code2 className="h-4 w-4 text-blue-500" />
                                        Branch
                                    </Label>
                                    <Select value={formData.branch} onValueChange={(val) => handleSelectChange('branch', val)}>
                                        <SelectTrigger className="h-12 text-base rounded-xl">
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
                            <div className="grid gap-2">
                                <Label htmlFor="cgpa" className="text-sm font-semibold">CGPA (out of 10)</Label>
                                <Input id="cgpa" name="cgpa" type="number" step="0.01" min="0" max="10" value={formData.cgpa} onChange={handleChange} required
                                    className="h-12 text-base rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="skills" className="text-sm font-semibold">Technical Skills (comma separated)</Label>
                                <Input id="skills" name="skills" value={formData.skills} onChange={handleChange} required placeholder="Python, React, AWS..." 
                                    className="h-12 text-base rounded-xl" />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Online Profiles */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Online Profiles</p>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="linkedin_url" className="text-sm font-semibold flex items-center gap-2">
                                    <Linkedin className="h-4 w-4 text-blue-700" />
                                    LinkedIn URL
                                </Label>
                                <Input id="linkedin_url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..."
                                    className="h-12 text-base rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="github_url" className="text-sm font-semibold flex items-center gap-2">
                                    <Github className="h-4 w-4 text-gray-800" />
                                    GitHub URL
                                </Label>
                                <Input id="github_url" name="github_url" value={formData.github_url} onChange={handleChange} placeholder="https://github.com/..."
                                    className="h-12 text-base rounded-xl" />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={loading} size="lg" className="h-12 px-8 text-base">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-5 w-5" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
