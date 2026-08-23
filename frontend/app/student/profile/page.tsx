'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, GraduationCap, Github, Linkedin } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function StudentProfilePage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        branch: '',
        year: '',
        cgpa: '',
        skills: '',
        github_url: '',
        linkedin_url: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            // Convert skills string to array
            const skillsArray = formData.skills
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0)

            const payload = {
                branch: formData.branch,
                year: formData.year,
                cgpa: parseFloat(formData.cgpa),
                skills: skillsArray,
                github_url: formData.github_url || undefined,
                linkedin_url: formData.linkedin_url || undefined
            }

            await api.put('/api/student/update', payload)

            // Redirect to dashboard after successful profile update
            router.push('/dashboard')
        } catch (err: any) {
            console.error('Profile Update Error:', err)
            setError(err.response?.data?.detail || 'Failed to update profile. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl"
            >
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden ring-1 ring-white/50">
                    <CardHeader className="space-y-2 text-center pb-6 border-b border-gray-100/50 bg-gradient-to-b from-white to-gray-50/50">
                        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-2">
                            <GraduationCap className="text-white h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Complete Your Profile
                        </CardTitle>
                        <CardDescription className="text-gray-500 text-sm">
                            Tell us about yourself to get personalized placement insights
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6 px-6 pb-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Branch and Year - Side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="branch" className="text-gray-700 font-medium text-sm">
                                        Branch/Department *
                                    </Label>
                                    <Select
                                        value={formData.branch}
                                        onValueChange={(value) => handleSelectChange('branch', value)}
                                        required
                                    >
                                        <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-10">
                                            <SelectValue placeholder="Select branch" />
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

                                <div className="space-y-1.5">
                                    <Label htmlFor="year" className="text-gray-700 font-medium text-sm">
                                        Year *
                                    </Label>
                                    <Select
                                        value={formData.year}
                                        onValueChange={(value) => handleSelectChange('year', value)}
                                        required
                                    >
                                        <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-10">
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FY">First Year (FY)</SelectItem>
                                            <SelectItem value="SY">Second Year (SY)</SelectItem>
                                            <SelectItem value="TY">Third Year (TY)</SelectItem>
                                            <SelectItem value="FINAL">Final Year (FINAL)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* CGPA */}
                            <div className="space-y-1.5">
                                <Label htmlFor="cgpa" className="text-gray-700 font-medium text-sm">
                                    CGPA *
                                </Label>
                                <Input
                                    id="cgpa"
                                    name="cgpa"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    placeholder="e.g., 8.5"
                                    required
                                    value={formData.cgpa}
                                    onChange={handleChange}
                                    className="bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-10"
                                />
                            </div>

                            {/* Skills */}
                            <div className="space-y-1.5">
                                <Label htmlFor="skills" className="text-gray-700 font-medium text-sm">
                                    Skills *
                                </Label>
                                <Input
                                    id="skills"
                                    name="skills"
                                    type="text"
                                    placeholder="e.g., Python, JavaScript, React, Node.js (comma separated)"
                                    required
                                    value={formData.skills}
                                    onChange={handleChange}
                                    className="bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-10"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Separate skills with commas
                                </p>
                            </div>

                            {/* GitHub URL */}
                            <div className="space-y-1.5">
                                <Label htmlFor="github_url" className="text-gray-700 font-medium text-sm">
                                    GitHub Profile (Optional)
                                </Label>
                                <div className="relative">
                                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="github_url"
                                        name="github_url"
                                        type="url"
                                        placeholder="https://github.com/yourusername"
                                        value={formData.github_url}
                                        onChange={handleChange}
                                        className="bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-10 pl-10"
                                    />
                                </div>
                            </div>

                            {/* LinkedIn URL */}
                            <div className="space-y-1.5">
                                <Label htmlFor="linkedin_url" className="text-gray-700 font-medium text-sm">
                                    LinkedIn Profile (Optional)
                                </Label>
                                <div className="relative">
                                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="linkedin_url"
                                        name="linkedin_url"
                                        type="url"
                                        placeholder="https://linkedin.com/in/yourusername"
                                        value={formData.linkedin_url}
                                        onChange={handleChange}
                                        className="bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-10 pl-10"
                                    />
                                </div>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-700">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle className="text-sm font-semibold">Error</AlertTitle>
                                    <AlertDescription className="text-xs">{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-6"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving Profile...
                                    </>
                                ) : (
                                    'Complete Profile'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-gray-400 mt-6">
                    Your profile helps us provide personalized placement readiness insights
                </p>
            </motion.div>
        </div>
    )
}
