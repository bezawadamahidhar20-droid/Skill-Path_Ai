from fastapi import APIRouter, HTTPException
from app.database import get_pool
from app.models.student_model import StudentSignup, StudentLogin
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

    # Insert new student
    hashed_password = hash_password(student.password)
    await pool.execute(
        """INSERT INTO students (name, email, password, year, branch, cgpa, skills, linkedin_url, github_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
        student.name,
        student.email,
        hashed_password,
        student.year,
        student.branch,
        student.cgpa,
        student.skills,  # PostgreSQL array
        student.linkedin_url,
        student.github_url,
    )

    # Auto-login after signup
    token = create_access_token({"email": student.email, "role": "student"})

    return {"message": "Student registered successfully", "access_token": token, "token_type": "bearer"}


@router.post("/login")
async def login(student: StudentLogin):
    pool = await get_pool()
    
    user = await pool.fetchrow(
        "SELECT * FROM students WHERE email = $1", student.email
    )
    if not user:
        # Check admin table
        admin = await pool.fetchrow(
            "SELECT * FROM admins WHERE email = $1", student.email
        )
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not verify_password(student.password, admin["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_access_token({"email": admin["email"], "role": "admin"})
        return {"access_token": token, "token_type": "bearer", "role": "admin"}

    if not verify_password(student.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = user.get("role", "student")
    token = create_access_token({"email": user["email"], "role": role})

    return {"access_token": token, "token_type": "bearer", "role": role}
