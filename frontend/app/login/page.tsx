'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowRight, Loader2, CheckCircle2, User, Mail, Lock, GraduationCap, Code2, Linkedin, Github, Sparkles, ChevronDown } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    year: '',
    branch: '',
    cgpa: '',
    skills: '',
    linkedin_url: '',
    github_url: ''
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
    setError("")
    setSuccessMessage("")

    try {
      if (isLogin) {
        const response = await api.post("/api/auth/login", {
          email: formData.email,
          password: formData.password,
        })
        await handleAuthSuccess(response.data.access_token, response.data.role)
      } else {
        const payload = {
          ...formData,
          cgpa: parseFloat(formData.cgpa),
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
        }

        const response = await api.post("/api/auth/signup", payload)

        setSuccessMessage("Account created successfully! Redirecting to your dashboard...")
        setTimeout(async () => {
          await handleAuthSuccess(response.data.access_token, 'student')
        }, 1500)
      }

    } catch (err: any) {
      console.error("Auth Error:", err)

      // Better error messages for common issues
      if (!err.response && err.message === 'Network Error') {
        setError("Cannot connect to server. Please make sure the backend is running on http://localhost:8000")
      } else {
        const detail = err.response?.data?.detail
        if (Array.isArray(detail)) {
          setError(detail.map((e: any) => e.msg).join(', '))
        } else {
          setError(detail || "Authentication failed. Please check your inputs.")
        }
      }
    } finally {
      if (!successMessage) setIsLoading(false)
    }
  }

  const handleAuthSuccess = async (token: string, role: string = 'student') => {
    const { setAuthToken, setUserRole } = await import('@/lib/auth')
    setAuthToken(token)
    setUserRole(role as 'admin' | 'student')

    if (role === 'admin') {
      router.push('/admin/dashboard')
      return
    }

    try {
      const studentRes = await api.get("/api/student/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const studentData = studentRes.data

      const profileCompleted =
        studentData.branch &&
        studentData.year &&
        studentData.skills &&
        studentData.skills.length > 0

      if (!profileCompleted) {
        router.push("/student/profile")
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Profile check failed", err)
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 relative overflow-hidden">

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[70vh] h-[70vh] rounded-full bg-gradient-to-br from-blue-400/10 to-purple-400/10 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] -left-[10%] w-[60vh] h-[60vh] rounded-full bg-gradient-to-tr from-cyan-400/10 to-blue-400/10 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden ring-1 ring-white/50">
          <CardHeader className="space-y-3 text-center pb-6 border-b border-gray-100/50 bg-gradient-to-b from-white to-gray-50/50 pt-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-2">
              <span className="text-white font-bold text-2xl">CQ</span>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900 tracking-tight">
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription className="text-gray-500 mt-2 text-base">
                {isLogin ? "Sign in to access your CampusIQ dashboard" : "Join CampusIQ for personalized placement insights"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-8 px-8 max-h-[75vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-5">

              {!isLogin && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl"
                    />
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-500" />
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl"
                />
              </div>

              {!isLogin && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5">
                  <Separator className="my-2" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Academic Details</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-500" />
                        Year
                      </Label>
                      <Select value={formData.year} onValueChange={(val) => handleSelectChange('year', val)} required>
                        <SelectTrigger className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl">
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FY">First Year (FY)</SelectItem>
                          <SelectItem value="SY">Second Year (SY)</SelectItem>
                          <SelectItem value="TY">Third Year (TY)</SelectItem>
                          <SelectItem value="FINAL">Final Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-blue-500" />
                        Branch
                      </Label>
                      <Select value={formData.branch} onValueChange={(val) => handleSelectChange('branch', val)} required>
                        <SelectTrigger className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl">
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CSE">CSE</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="ECS">ECS</SelectItem>
                          <SelectItem value="ENTC">ENTC</SelectItem>
                          <SelectItem value="MECH">MECH</SelectItem>
                          <SelectItem value="CIVIL">CIVIL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cgpa" className="text-sm font-semibold text-gray-700">
                      CGPA (out of 10)
                    </Label>
                    <Input
                      id="cgpa"
                      name="cgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      required
                      placeholder="e.g. 8.5"
                      value={formData.cgpa}
                      onChange={handleChange}
                      className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      Key Skills
                    </Label>
                    <Input
                      id="skills"
                      name="skills"
                      required
                      placeholder="e.g. Java, Python, React, SQL, MongoDB"
                      value={formData.skills}
                      onChange={handleChange}
                      className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl"
                    />
                    <p className="text-xs text-gray-400">Separate multiple skills with commas</p>
                  </div>

                  <Separator className="my-2" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Online Profiles (Optional)</p>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      LinkedIn URL
                    </Label>
                    <Input
                      id="linkedin_url"
                      name="linkedin_url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github_url" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Github className="h-4 w-4 text-gray-800" />
                      GitHub URL
                    </Label>
                    <Input
                      id="github_url"
                      name="github_url"
                      placeholder="https://github.com/yourusername"
                      value={formData.github_url}
                      onChange={handleChange}
                      className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl"
                    />
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 py-3 rounded-xl">
                      <AlertCircle className="h-5 w-5" />
                      <AlertTitle className="text-sm font-semibold">Error</AlertTitle>
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <Alert className="bg-green-50 border-green-200 text-green-700 py-3 rounded-xl">
                      <CheckCircle2 className="h-5 w-5" />
                      <AlertTitle className="text-sm font-semibold">Success</AlertTitle>
                      <AlertDescription className="text-sm">{successMessage}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isLogin ? "Authenticating..." : "Creating Account..."}
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"} <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 bg-gray-50/50 py-6 border-t border-gray-100">
            <div className="w-full flex justify-center text-base items-center gap-2">
              <span className="text-gray-500">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError("")
                  setSuccessMessage("")
                }}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                {isLogin ? "Sign Up" : "Log In"}
              </button>
            </div>

            <div className="text-center w-full">
              <p className="text-xs text-gray-400">
                Secure authentication powered by CampusIQ
              </p>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-8">
          &copy; 2026 CampusIQ. Secure Placement Intelligence.
        </p>
      </motion.div>
    </div>
  )
}
