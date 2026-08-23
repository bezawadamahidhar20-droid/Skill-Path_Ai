from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from datetime import datetime, timedelta, timezone
import json

from app.database import get_pool
from app.utils.auth_dependency import get_current_user
from app.models.student_model import StudentUpdate, StudentOnboarding
from app.models.schemas import AgentQuerySchema
from app.utils.rate_limiter import rate_limit
from app.services.agent_service import run_placement_agent_workflow

router = APIRouter()

@router.get("/me")
async def get_my_profile(user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    try:
        student = await pool.fetchrow(
            """SELECT id, name, email, year, branch, cgpa, skills, skills_with_levels, linkedin_url, github_url,
                      avatar_url, provider, onboarding_completed, target_role,
                      role, prs_score, prs_level, prs_breakdown, github_analysis, 
                      github_groq_analysis, resume_analysis, ats_score
               FROM students WHERE email = $1""",
            email,
        )
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")

        result = dict(student)
        result["id"] = str(result["id"])
        
        if result.get("skills") is None:
            result["skills"] = []
        else:
            result["skills"] = list(result["skills"])
        
        for field in ["prs_breakdown", "github_analysis", "github_groq_analysis", "resume_analysis", "skills_with_levels"]:
            val = result.get(field)
            if isinstance(val, str):
                try:
                    result[field] = json.loads(val)
                except (json.JSONDecodeError, TypeError):
                    result[field] = [] if field == "skills_with_levels" else None

        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(exc)}")


@router.put("/onboarding", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60))])
async def submit_onboarding(data: StudentOnboarding, user=Depends(get_current_user)):
    """
    Idempotent Onboarding handler. Uses PostgreSQL row locking to prevent race conditions.
    """
    email = user["email"]
    pool = await get_pool()

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Row lock to prevent race condition double-submit
            student = await conn.fetchrow(
                "SELECT id, onboarding_completed FROM students WHERE email = $1 FOR UPDATE",
                email
            )
            if not student:
                raise HTTPException(status_code=404, detail="Student record not found")

            await conn.execute(
                """UPDATE students 
                   SET year = $1, branch = $2, cgpa = $3, skills = $4,
                       skills_with_levels = $5::jsonb, target_role = $6, onboarding_completed = TRUE
                   WHERE email = $7""",
                data.year,
                data.branch,
                data.cgpa,
                data.skills,
                json.dumps(data.skills_with_levels),
                data.target_role,
                email,
            )

    # Automatically trigger PRS calculation after onboarding completion
    try:
        await calculate_student_prs(user)
    except Exception as e:
        pass

    return {"message": "Onboarding completed successfully", "onboarding_completed": True}


@router.put("/update")
async def update_profile(update_data: StudentUpdate, user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    try:
        existing = await pool.fetchrow("SELECT id FROM students WHERE email = $1", email)
        if not existing:
            raise HTTPException(status_code=404, detail="Student not found")

        updates = []
        values = []
        idx = 2

        if update_data.cgpa is not None:
            updates.append(f"cgpa = ${idx}")
            values.append(update_data.cgpa)
            idx += 1

        if update_data.skills is not None:
            updates.append(f"skills = ${idx}")
            values.append(update_data.skills)
            idx += 1

        if update_data.target_role is not None:
            updates.append(f"target_role = ${idx}")
            values.append(update_data.target_role)
            idx += 1

        if update_data.linkedin_url is not None:
            updates.append(f"linkedin_url = ${idx}")
            values.append(update_data.linkedin_url)
            idx += 1

        if update_data.github_url is not None:
            updates.append(f"github_url = ${idx}")
            values.append(update_data.github_url)
            idx += 1

        if update_data.resume_analysis is not None:
            updates.append(f"resume_analysis = ${idx}::jsonb")
            values.append(json.dumps(update_data.resume_analysis))
            idx += 1

        if update_data.ats_score is not None:
            updates.append(f"ats_score = ${idx}")
            values.append(update_data.ats_score)
            idx += 1

        if updates:
            query = f"UPDATE students SET {', '.join(updates)} WHERE email = $1"
            await pool.execute(query, email, *values)

        return {"message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(exc)}")


@router.post("/calculate-prs")
async def calculate_student_prs(user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    student = await pool.fetchrow("SELECT * FROM students WHERE email = $1", email)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    from app.services.prs_service import calculate_prs
    
    student_dict = dict(student)
    student_dict["skills"] = list(student_dict.get("skills", []))
    
    for field in ["github_analysis", "github_groq_analysis", "resume_analysis", "prs_breakdown"]:
        val = student_dict.get(field)
        if isinstance(val, str):
            try:
                student_dict[field] = json.loads(val)
            except (json.JSONDecodeError, TypeError):
                student_dict[field] = None

    prs_result = calculate_prs(student_dict)

    await pool.execute(
        """UPDATE students SET prs_score = $1, prs_level = $2, prs_breakdown = $3::jsonb
           WHERE email = $4""",
        prs_result["prs_score"],
        prs_result["prs_level"],
        json.dumps(prs_result["breakdown"]),
        email,
    )

    return {
        "message": "PRS calculated successfully",
        "prs_score": prs_result["prs_score"],
        "prs_level": prs_result["prs_level"],
        "target_role_match_pct": prs_result.get("target_role_match_pct", 75),
        "prs_breakdown": prs_result["breakdown"],
        "skill_gap_vector": prs_result.get("skill_gap_vector", {})
    }


@router.post("/agent/execute", dependencies=[Depends(rate_limit(max_requests=30, window_seconds=60))])
async def execute_agent_query(payload: AgentQuerySchema, user=Depends(get_current_user)):
    """
    Multi-step Agentic Placement Co-Pilot & STAR Mock Interviewer Agent endpoint.
    """
    email = user["email"]
    pool = await get_pool()

    try:
        res = await run_placement_agent_workflow(
            email=email,
            agent_id=payload.agent_id,
            message=payload.message,
            mode=payload.mode or "chat",
            interview_step=payload.interview_step or 0,
            answer_text=payload.answer_text or "",
            pool=pool
        )
        return {"success": True, "result": res}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(exc)}")


@router.post("/analyze/github")
async def analyze_my_github(user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    student = await pool.fetchrow("SELECT * FROM students WHERE email = $1", email)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing_analysis = student.get("github_analysis")
    if existing_analysis:
        if isinstance(existing_analysis, str):
            existing_analysis = json.loads(existing_analysis)
        if existing_analysis and existing_analysis.get("last_updated"):
            last_updated = datetime.fromisoformat(existing_analysis["last_updated"])
            if datetime.now(timezone.utc) - last_updated < timedelta(hours=24):
                return {
                    "message": "GitHub analysis already cached (last 24 hours)",
                    "github_analysis": existing_analysis,
                }

    github_url = student.get("github_url")
    if not github_url:
        raise HTTPException(status_code=400, detail="GitHub URL not set in profile")

    try:
        from app.services.github_service import analyze_github_profile
        analysis = analyze_github_profile(github_url)
        analysis["last_updated"] = datetime.now(timezone.utc).isoformat()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub analysis failed: {str(e)}")

    await pool.execute(
        "UPDATE students SET github_analysis = $1::jsonb WHERE email = $2",
        json.dumps(analysis),
        email,
    )

    return {"message": "GitHub analysis completed", "github_analysis": analysis}


@router.post("/analyze/resume")
async def analyze_student_resume(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    email = user["email"]
    pool = await get_pool()

    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file uploaded")

    from app.services.resume_service import analyze_resume
    analysis_result = analyze_resume(contents, file.content_type)
    ats_score = analysis_result.get("ats_score", 0)

    await pool.execute(
        "UPDATE students SET resume_analysis = $1::jsonb, ats_score = $2 WHERE email = $3",
        json.dumps(analysis_result),
        ats_score,
        email,
    )

    return {
        "message": "Resume analyzed successfully",
        "ats_score": ats_score,
        "analysis": analysis_result,
    }


@router.get("/company-match")
async def company_match(user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    student = await pool.fetchrow("SELECT * FROM students WHERE email = $1", email)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    companies = await pool.fetch("SELECT * FROM companies")
    companies_list = [dict(c) for c in companies]
    
    for c in companies_list:
        c["required_skills"] = list(c.get("required_skills", []))
        c["eligible_years"] = list(c.get("eligible_years", []))
        c["eligible_branches"] = list(c.get("eligible_branches", []))

    from app.services.company_match_service import match_student_with_companies
    
    student_dict = dict(student)
    student_dict["skills"] = list(student_dict.get("skills", []))
    
    for field in ["github_analysis", "resume_analysis"]:
        val = student_dict.get(field)
        if isinstance(val, str):
            try:
                student_dict[field] = json.loads(val)
            except (json.JSONDecodeError, TypeError):
                student_dict[field] = None

    match_result = match_student_with_companies(student_dict, companies_list)

    from app.services.groq_service import analyze_company_matches_with_groq
    try:
        ai_analysis = analyze_company_matches_with_groq(student_dict, match_result["matches"])
    except Exception as e:
        ai_analysis = {
            "profile_strengths": ["AI analysis unavailable"],
            "profile_weaknesses": [],
            "overall_profile_summary": f"AI analysis notice: {str(e)}",
            "company_insights": [],
            "top_priority_actions": [],
            "recommended_companies_to_focus": [],
            "error": str(e),
        }

    return {
        "message": "Company matching completed",
        "company_matches": match_result["matches"],
        "ai_analysis": ai_analysis,
    }


@router.get("/roadmap-tasks")
async def get_roadmap_tasks(user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    student = await pool.fetchrow("SELECT id FROM students WHERE email = $1", email)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    rows = await pool.fetch(
        "SELECT task_id, task_title, completed FROM roadmap_tasks WHERE student_id = $1",
        student["id"],
    )
    return {"tasks": [{"task_id": r["task_id"], "task_title": r["task_title"], "completed": r["completed"]} for r in rows]}


@router.post("/roadmap-tasks")
async def save_roadmap_task(task: dict, user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    student = await pool.fetchrow("SELECT id FROM students WHERE email = $1", email)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    task_id = task.get("task_id")
    completed = task.get("completed", False)
    task_title = task.get("task_title", "")

    if not task_id:
        raise HTTPException(status_code=400, detail="task_id is required")

    await pool.execute("""
        INSERT INTO roadmap_tasks (student_id, task_id, task_title, completed, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (student_id, task_id) DO UPDATE SET completed = $4, updated_at = NOW()
    """, student["id"], task_id, task_title, completed)

    return {"message": "Task updated successfully"}
