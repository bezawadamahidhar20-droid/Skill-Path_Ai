from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from datetime import datetime, timedelta, timezone

from app.database import get_pool
from app.utils.auth_dependency import get_current_user
from app.models.student_model import StudentUpdate


router = APIRouter()


@router.get("/me")
async def get_my_profile(user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    student = await pool.fetchrow(
        """SELECT id, name, email, year, branch, cgpa, skills, linkedin_url, github_url,
                  role, prs_score, prs_level, prs_breakdown, github_analysis, 
                  github_groq_analysis, resume_analysis, ats_score
           FROM students WHERE email = $1""",
        email,
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Convert to dict and handle JSON/array fields
    result = dict(student)
    result["id"] = str(result["id"])
    
    # Convert skills from PostgreSQL array to Python list
    if result.get("skills") is None:
        result["skills"] = []
    else:
        result["skills"] = list(result["skills"])
    
    # Convert JSONB fields from string to dict if needed
    import json
    for field in ["prs_breakdown", "github_analysis", "github_groq_analysis", "resume_analysis"]:
        val = result.get(field)
        if isinstance(val, str):
            try:
                result[field] = json.loads(val)
            except (json.JSONDecodeError, TypeError):
                result[field] = None

    return result


@router.put("/update")
async def update_profile(update_data: StudentUpdate, user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    existing = await pool.fetchrow("SELECT id FROM students WHERE email = $1", email)
    if not existing:
        raise HTTPException(status_code=404, detail="Student not found")

    # Build dynamic update
    updates = []
    values = []
    idx = 2  # $1 is email

    if update_data.cgpa is not None:
        updates.append(f"cgpa = ${idx}")
        values.append(update_data.cgpa)
        idx += 1

    if update_data.skills is not None:
        updates.append(f"skills = ${idx}")
        values.append(update_data.skills)
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
        import json
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


@router.post("/analyze/github")
async def analyze_my_github(user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    student = await pool.fetchrow("SELECT * FROM students WHERE email = $1", email)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Cache check (24 hours)
    existing_analysis = student.get("github_analysis")
    if existing_analysis:
        import json
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
        raise HTTPException(status_code=500, detail=str(e))

    import json
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
        raise HTTPException(status_code=400, detail="Invalid file")

    from app.services.resume_service import analyze_resume
    analysis_result = analyze_resume(contents, file.content_type)
    ats_score = analysis_result.get("ats_score", 0)

    import json
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


@router.post("/calculate-prs")
async def calculate_student_prs(user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    student = await pool.fetchrow(
        """SELECT * FROM students WHERE email = $1""",
        email,
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    from app.services.prs_service import calculate_prs
    
    # Convert student dict for prs_service
    student_dict = dict(student)
    student_dict["skills"] = list(student_dict.get("skills", []))
    
    import json
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
        "prs_breakdown": prs_result["breakdown"],
    }


@router.get("/company-match")
async def company_match(user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    student = await pool.fetchrow(
        "SELECT * FROM students WHERE email = $1",
        email,
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    companies = await pool.fetch("SELECT * FROM companies")
    companies_list = [dict(c) for c in companies]
    
    # Convert arrays
    for c in companies_list:
        c["required_skills"] = list(c.get("required_skills", []))
        c["eligible_years"] = list(c.get("eligible_years", []))
        c["eligible_branches"] = list(c.get("eligible_branches", []))

    from app.services.company_match_service import match_student_with_companies
    
    student_dict = dict(student)
    student_dict["skills"] = list(student_dict.get("skills", []))
    
    import json
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
            "overall_profile_summary": f"AI analysis failed: {str(e)}",
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


@router.post("/analyze/github-detailed")
async def analyze_github_detailed(user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()

    student = await pool.fetchrow("SELECT * FROM students WHERE email = $1", email)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    import json
    github_analysis = student.get("github_analysis")
    if isinstance(github_analysis, str):
        github_analysis = json.loads(github_analysis)
    if not github_analysis:
        raise HTTPException(
            status_code=400,
            detail="Please run basic GitHub analysis first before requesting detailed analysis",
        )

    existing_groq = student.get("github_groq_analysis")
    if isinstance(existing_groq, str):
        existing_groq = json.loads(existing_groq)
    if existing_groq and existing_groq.get("last_updated"):
        last_updated = datetime.fromisoformat(existing_groq["last_updated"])
        if datetime.now(timezone.utc) - last_updated < timedelta(hours=24):
            return {
                "message": "Detailed analysis already cached (last 24 hours)",
                "groq_analysis": existing_groq,
            }

    from app.services.groq_service import analyze_github_with_groq
    try:
        groq_analysis = analyze_github_with_groq(github_analysis)
        groq_analysis["last_updated"] = datetime.now(timezone.utc).isoformat()
        await pool.execute(
            "UPDATE students SET github_groq_analysis = $1::jsonb WHERE email = $2",
            json.dumps(groq_analysis),
            email,
        )
        return {"message": "Detailed GitHub analysis completed", "groq_analysis": groq_analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq analysis failed: {str(e)}")


@router.delete("/analyze/github-detailed/cache")
async def clear_groq_cache(user=Depends(get_current_user)):
    email = user["email"]
    pool = await get_pool()
    await pool.execute(
        "UPDATE students SET github_groq_analysis = NULL WHERE email = $1", email
    )
    return {"message": "Groq analysis cache cleared successfully"}
