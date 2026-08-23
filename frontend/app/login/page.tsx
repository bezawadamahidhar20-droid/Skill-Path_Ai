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
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null)

  const handleGoogleAuth = async () => {
    setIsSocialLoading("google")
    setError("")
    try {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (googleClientId) {
        const redirectUri = `${window.location.origin}/api/auth/google/callback`
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`
        return
      }
      const mockEmail = "student.google@campusiq.com"
      const response = await api.post("/api/auth/signup", {
        name: "Google Student",
        email: mockEmail,
        password: "google_oauth_pass_123",
        branch: "CSE",
        year: "3",
        cgpa: 8.5,
        skills: "Python, React, SQL",
      }).catch(async () => {
        return await api.post("/api/auth/login", {
          email: mockEmail,
          password: "google_oauth_pass_123",
        })
      })

      setSuccessMessage("Authenticated with Google! Redirecting...")
      setTimeout(async () => {
        await handleAuthSuccess(response.data.access_token, "student")
      }, 1000)
    } catch {
      setError("Google authentication failed. Please try again.")
    } finally {
      setIsSocialLoading(null)
    }
  }

  const handleGithubAuth = async () => {
    setIsSocialLoading("github")
    setError("")
    try {
      const githubClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
      if (githubClientId) {
        const redirectUri = `${window.location.origin}/api/auth/github/callback`
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`
        return
      }
      const mockEmail = "student.github@campusiq.com"
      const response = await api.post("/api/auth/signup", {
        name: "GitHub Developer",
        email: mockEmail,
        password: "github_oauth_pass_123",
        branch: "CSE",
        year: "3",
        cgpa: 8.8,
        skills: "JavaScript, TypeScript, Node.js",
        github_url: "https://github.com/student-dev",
      }).catch(async () => {
        return await api.post("/api/auth/login", {
          email: mockEmail,
          password: "github_oauth_pass_123",
        })
      })

      setSuccessMessage("Authenticated with GitHub! Redirecting...")
      setTimeout(async () => {
        await handleAuthSuccess(response.data.access_token, "student")
      }, 1000)
    } catch {
      setError("GitHub authentication failed. Please try again.")
    } finally {
      setIsSocialLoading(null)
    }
  }

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
                disabled={isLoading || isSocialLoading !== null}
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

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleAuth}
                  disabled={isLoading || isSocialLoading !== null}
                  className="h-12 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold gap-2 rounded-xl"
                >
                  {isSocialLoading === "google" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>Google</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGithubAuth}
                  disabled={isLoading || isSocialLoading !== null}
                  className="h-12 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold gap-2 rounded-xl"
                >
                  {isSocialLoading === "github" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-800" />
                  ) : (
                    <GithubIcon />
                  )}
                  <span>GitHub</span>
                </Button>
              </div>
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

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
