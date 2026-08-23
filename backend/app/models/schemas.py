from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class StudentSignupSchema(BaseModel):
    name: str = Field(..., min_length=2, description="Student full name")
    email: EmailStr
    password: Optional[str] = Field(None, min_length=6)
    year: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    skills: Optional[List[str]] = []
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

class StudentLoginSchema(BaseModel):
    email: EmailStr
    password: str

class StudentOnboardingSchema(BaseModel):
    year: str
    branch: str
    cgpa: float = Field(..., ge=0.0, le=10.0)
    skills: List[str]
    skills_with_levels: List[Dict[str, Any]]
    target_role: str

class AgentQuerySchema(BaseModel):
    agent_id: str
    message: str
    mode: Optional[str] = "chat" # chat or mock_interview
    interview_step: Optional[int] = 0
    answer_text: Optional[str] = None

class MockInterviewResponseSchema(BaseModel):
    question: str
    eval_score: Optional[int] = None
    star_breakdown: Optional[Dict[str, Any]] = None
    feedback: Optional[str] = None
    next_step: int

class PRSScoreResponse(BaseModel):
    prs_score: int = Field(..., ge=0, le=100)
    prs_level: str
    target_role_match_pct: int
    breakdown: Dict[str, Any]
    skill_gap_vector: Dict[str, Any]
