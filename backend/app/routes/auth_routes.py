import json
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_pool
from app.models.student_model import StudentSignup, StudentLogin, StudentOAuth
from app.models.schemas import StudentSignupSchema, StudentLoginSchema
from app.utils.password_hash import hash_password, verify_password
from app.utils.jwt_handler import create_access_token
from app.utils.rate_limiter import rate_limit

router = APIRouter()

@router.post("/signup", dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60))])
async def signup(student: StudentSignupSchema):
    pool = await get_pool()
    
    existing = await pool.fetchrow(
        "SELECT id FROM students WHERE email = $1", student.email
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(student.password) if student.password else None
    has_profile = bool(student.year and student.branch and student.cgpa)

    await pool.execute(
        """INSERT INTO students (name, email, password, year, branch, cgpa, skills, linkedin_url, github_url, onboarding_completed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)""",
        student.name,
        student.email,
        hashed_password,
        student.year,
        student.branch,
        student.cgpa,
        student.skills or [],
        student.linkedin_url,
        student.github_url,
        has_profile,
    )

    token = create_access_token({"email": student.email, "role": "student"})
    return {
        "message": "Student registered successfully",
        "access_token": token,
        "token_type": "bearer",
        "role": "student",
        "onboarding_completed": has_profile,
    }


@router.post("/login", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60))])
async def login(student: StudentLoginSchema):
    pool = await get_pool()
    
    user = await pool.fetchrow(
        "SELECT * FROM students WHERE email = $1", student.email
    )
    if not user:
        admin = await pool.fetchrow(
            "SELECT * FROM admins WHERE email = $1", student.email
        )
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not verify_password(student.password, admin["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_access_token({"email": admin["email"], "role": "admin"})
        return {"access_token": token, "token_type": "bearer", "role": "admin", "onboarding_completed": True}

    if user["password"] and not verify_password(student.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = user.get("role", "student")
    token = create_access_token({"email": user["email"], "role": role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role,
        "onboarding_completed": bool(user.get("onboarding_completed", False)),
    }


@router.post("/demo")
async def judge_demo_login():
    """
    Sub-60-second Hackathon Judge Demo Mode.
    Pre-seeds a fully populated demo student profile ('Alex Chen') and returns valid authentication token.
    """
    pool = await get_pool()
    demo_email = "demo.judge@placementiq.ai"

    demo_skills = ["Python", "Java", "C++", "React", "Next.js", "FastAPI", "SQL", "Git", "DSA", "System Design"]
    demo_skills_levels = [
        {"name": "Python", "level": "Advanced"},
        {"name": "React", "level": "Advanced"},
        {"name": "System Design", "level": "Intermediate"},
        {"name": "DSA", "level": "Advanced"}
    ]
    
    demo_github = {
        "github_score": 85,
        "top_languages": ["Python", "TypeScript", "C++", "SQL"],
        "activity_summary": {"commits_last_90_days_estimated": 112},
        "project_type_distribution": {"Web Development": 4, "Machine Learning": 2, "Systems": 1},
        "last_updated": "2026-08-23T10:00:00Z"
    }

    demo_resume = {
        "ats_score": 88,
        "summary": "Experienced Full Stack Developer with focus on distributed systems & modern web.",
        "skills_found": demo_skills,
        "suggestions": ["Add metric outcomes for secondary projects"]
    }

    demo_breakdown = {
        "github_score_25": 21,
        "skills_score_15": 14,
        "cgpa_score_10": 9,
        "activity_score_10": 9,
        "project_diversity_score_10": 8,
        "language_diversity_score_10": 8,
        "resume_ats_score_20": 18,
        "raw_total_100": 87
    }

    existing = await pool.fetchrow("SELECT id FROM students WHERE email = $1", demo_email)
    
    if existing:
        student_id = existing["id"]
        await pool.execute(
            """UPDATE students SET 
                name = 'Alex Chen (Demo Account)',
                year = 'FINAL',
                branch = 'CSE',
                cgpa = 8.8,
                skills = $1,
                skills_with_levels = $2::jsonb,
                target_role = 'Software Engineer',
                onboarding_completed = TRUE,
                prs_score = 87,
                prs_level = 'Excellent',
                prs_breakdown = $3::jsonb,
                github_analysis = $4::jsonb,
                resume_analysis = $5::jsonb,
                ats_score = 88
               WHERE id = $6""",
            demo_skills,
            json.dumps(demo_skills_levels),
            json.dumps(demo_breakdown),
            json.dumps(demo_github),
            json.dumps(demo_resume),
            student_id
        )
    else:
        student_id = await pool.fetchval(
            """INSERT INTO students (
                name, email, year, branch, cgpa, skills, skills_with_levels,
                target_role, onboarding_completed, role, prs_score, prs_level,
                prs_breakdown, github_analysis, resume_analysis, ats_score
               ) VALUES (
                'Alex Chen (Demo Account)', $1, 'FINAL', 'CSE', 8.8, $2, $3::jsonb,
                'Software Engineer', TRUE, 'student', 87, 'Excellent',
                $4::jsonb, $5::jsonb, $6::jsonb, 88
               ) RETURNING id""",
            demo_email,
            demo_skills,
            json.dumps(demo_skills_levels),
            json.dumps(demo_breakdown),
            json.dumps(demo_github),
            json.dumps(demo_resume)
        )

    # Seed demo roadmap tasks
    demo_tasks = [
        ("task_1", "Master Distributed Cache & Redis Architecture", True),
        ("task_2", "Complete 25 LeetCode Medium/Hard Graphs & Dynamic Programming", True),
        ("task_3", "Mock Interview STAR Method Practice with AI Agent", False),
        ("task_4", "Optimize System Design Bullet Points on Resume", False)
    ]
    for tid, title, done in demo_tasks:
        await pool.execute("""
            INSERT INTO roadmap_tasks (student_id, task_id, task_title, completed)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (student_id, task_id) DO UPDATE SET completed = $4
        """, student_id, tid, title, done)

    token = create_access_token({"email": demo_email, "role": "student"})
    return {
        "message": "Demo mode activated successfully",
        "access_token": token,
        "token_type": "bearer",
        "role": "student",
        "onboarding_completed": True
    }


@router.post("/oauth")
async def oauth_authenticate(oauth: StudentOAuth):
    pool = await get_pool()

    student = await pool.fetchrow(
        """SELECT * FROM students 
           WHERE (provider = $1 AND provider_id = $2) OR email = $3""",
        oauth.provider,
        oauth.provider_account_id,
        oauth.email,
    )

    if student:
        await pool.execute(
            """UPDATE students 
               SET provider = $1, provider_id = $2, avatar_url = COALESCE($3, avatar_url),
                   name = COALESCE($4, name)
               WHERE id = $5""",
            oauth.provider,
            oauth.provider_account_id,
            oauth.avatar_url,
            oauth.name,
            student["id"],
        )
        email = student["email"]
        onboarding_completed = bool(student.get("onboarding_completed", False))
    else:
        await pool.execute(
            """INSERT INTO students (name, email, provider, provider_id, avatar_url, onboarding_completed, role)
               VALUES ($1, $2, $3, $4, $5, FALSE, 'student')""",
            oauth.name,
            oauth.email,
            oauth.provider,
            oauth.provider_account_id,
            oauth.avatar_url,
        )
        email = oauth.email
        onboarding_completed = False

    token = create_access_token({"email": email, "role": "student"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "student",
        "onboarding_completed": onboarding_completed,
    }
