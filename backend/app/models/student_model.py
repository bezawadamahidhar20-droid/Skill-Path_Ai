from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any


class StudentSignup(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = None
    year: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    skills: Optional[List[str]] = []
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None


class StudentLogin(BaseModel):
    email: EmailStr
    password: str


class StudentOAuth(BaseModel):
    provider: str
    provider_account_id: str
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None


class StudentOnboarding(BaseModel):
    year: str
    branch: str
    cgpa: float
    skills: List[str]
    skills_with_levels: List[Dict[str, Any]]
    target_role: str


class StudentProfile(BaseModel):
    name: str
    email: EmailStr
    year: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    skills: List[str] = []
    skills_with_levels: List[Dict[str, Any]] = []
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    avatar_url: Optional[str] = None
    provider: Optional[str] = "credentials"
    onboarding_completed: bool = False
    target_role: Optional[str] = "Software Engineer"
    prs_score: int = 0
    prs_breakdown: Optional[Dict[str, Any]] = None
    github_analysis: Optional[Dict[str, Any]] = None
    resume_analysis: Optional[Dict[str, Any]] = None
    ats_score: int = 0


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    year: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    skills: Optional[List[str]] = None
    skills_with_levels: Optional[List[Dict[str, Any]]] = None
    target_role: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    avatar_url: Optional[str] = None
    resume_analysis: Optional[Dict[str, Any]] = None
    ats_score: Optional[int] = None
