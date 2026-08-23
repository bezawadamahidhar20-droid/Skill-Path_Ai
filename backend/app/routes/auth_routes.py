from fastapi import APIRouter, HTTPException
from app.database import get_pool
from app.models.student_model import StudentSignup, StudentLogin, StudentOAuth
from app.utils.password_hash import hash_password, verify_password
from app.utils.jwt_handler import create_access_token

router = APIRouter()


@router.post("/signup")
async def signup(student: StudentSignup):
    pool = await get_pool()
    
    # Check if email already exists
    existing = await pool.fetchrow(
        "SELECT id FROM students WHERE email = $1", student.email
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(student.password) if student.password else None
    
    # Check if onboarding completed (if branch/year/cgpa are provided)
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


@router.post("/login")
async def login(student: StudentLogin):
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


@router.post("/oauth")
async def oauth_authenticate(oauth: StudentOAuth):
    pool = await get_pool()

    # Look up user by provider + provider_id OR email
    student = await pool.fetchrow(
        """SELECT * FROM students 
           WHERE (provider = $1 AND provider_id = $2) OR email = $3""",
        oauth.provider,
        oauth.provider_account_id,
        oauth.email,
    )

    if student:
        # Update provider link and avatar if missing
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
        # Create brand-new OAuth student
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
