from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.database import get_pool
from app.utils.auth_dependency import get_current_user

router = APIRouter()


@router.get("/dashboard/summary")
async def dashboard_summary(current_user=Depends(get_current_user)):
    pool = await get_pool()

    total = await pool.fetchval("SELECT COUNT(*) FROM students")
    avg_prs_result = await pool.fetchval("SELECT COALESCE(AVG(prs_score), 0) FROM students")
    avg_prs = round(float(avg_prs_result), 2) if avg_prs_result else 0

    red_count = await pool.fetchval("SELECT COUNT(*) FROM students WHERE prs_score < 40")
    yellow_count = await pool.fetchval(
        "SELECT COUNT(*) FROM students WHERE prs_score >= 40 AND prs_score <= 60"
    )
    green_count = await pool.fetchval("SELECT COUNT(*) FROM students WHERE prs_score > 60")

    return {
        "total_students": total or 0,
        "avg_prs": avg_prs,
        "red_count": red_count or 0,
        "yellow_count": yellow_count or 0,
        "green_count": green_count or 0,
    }


@router.get("/skills-analytics")
async def skills_analytics(current_user=Depends(get_current_user)):
    pool = await get_pool()

    rows = await pool.fetch("""
        SELECT LOWER(unnest) AS skill, COUNT(*) AS count
        FROM students, UNNEST(skills) AS unnest
        GROUP BY LOWER(unnest)
        ORDER BY count DESC
        LIMIT 20
    """)

    return {"top_skills": [{"skill": r["skill"], "count": r["count"]} for r in rows]}


@router.get("/dashboard/heatmap")
async def readiness_heatmap(current_user=Depends(get_current_user)):
    pool = await get_pool()

    rows = await pool.fetch("""
        SELECT branch, year, 
               ROUND(AVG(prs_score)::numeric, 2) AS avg_prs, 
               COUNT(*) AS count
        FROM students
        WHERE branch IS NOT NULL AND year IS NOT NULL
        GROUP BY branch, year
        ORDER BY branch, year
    """)

    return {
        "heatmap": [
            {"branch": r["branch"], "year": r["year"], "avg_prs": float(r["avg_prs"]), "count": r["count"]}
            for r in rows
        ]
    }


@router.get("/students/summary")
async def students_summary():
    pool = await get_pool()

    rows = await pool.fetch("""
        SELECT id, name, email, year, branch, cgpa, skills, prs_score, prs_level,
               github_analysis
        FROM students
        LIMIT 1000
    """)

    total = len(rows)
    avg_prs = sum(r.get("prs_score", 0) or 0 for r in rows) / total if total else 0

    students = []
    for r in rows:
        s = dict(r)
        s["id"] = str(s["id"])
        s["skills"] = list(s.get("skills", []))
        students.append(s)

    return {"total_students": total, "average_prs": round(avg_prs, 2), "students": students}


@router.get("/companies")
async def get_companies():
    pool = await get_pool()
    rows = await pool.fetch("SELECT * FROM companies")
    companies = []
    for r in rows:
        c = dict(r)
        c["id"] = str(c["id"])
        c["required_skills"] = list(c.get("required_skills", []))
        c["eligible_years"] = list(c.get("eligible_years", []))
        c["eligible_branches"] = list(c.get("eligible_branches", []))
        companies.append(c)
    return companies


@router.get("/students/filter")
async def filter_students(
    branch: Optional[str] = None,
    year: Optional[str] = None,
    current_user=Depends(get_current_user),
):
    pool = await get_pool()

    conditions = []
    values = []
    idx = 1

    if branch:
        conditions.append(f"branch = ${idx}")
        values.append(branch)
        idx += 1
    if year:
        conditions.append(f"year = ${idx}")
        values.append(year)
        idx += 1

    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

    rows = await pool.fetch(f"""
        SELECT name, email, branch, year, cgpa, skills, prs_score
        FROM students {where_clause}
        LIMIT 500
    """, *values)

    students = []
    for r in rows:
        s = dict(r)
        s["skills"] = list(s.get("skills", []))
        students.append(s)

    return {"count": len(students), "students": students}


@router.get("/risk-list")
async def risk_list(level: str = "red", current_user=Depends(get_current_user)):
    pool = await get_pool()

    if level == "red":
        condition = "prs_score < 40"
    elif level == "yellow":
        condition = "prs_score >= 40 AND prs_score <= 60"
    elif level == "green":
        condition = "prs_score > 60"
    else:
        raise HTTPException(status_code=400, detail="Invalid level. Use red/yellow/green")

    rows = await pool.fetch(f"""
        SELECT name, email, branch, year, cgpa, prs_score, prs_breakdown
        FROM students
        WHERE {condition}
        ORDER BY prs_score ASC
        LIMIT 200
    """)

    students = []
    for r in rows:
        s = dict(r)
        import json
        if isinstance(s.get("prs_breakdown"), str):
            try:
                s["prs_breakdown"] = json.loads(s["prs_breakdown"])
            except (json.JSONDecodeError, TypeError):
                s["prs_breakdown"] = None
        students.append(s)

    return {"level": level, "count": len(students), "students": students}


@router.get("/training-recommendations")
async def training_recommendations(current_user=Depends(get_current_user)):
    pool = await get_pool()

    rows = await pool.fetch("""
        SELECT branch, year,
               ROUND(AVG(prs_score)::numeric, 2) AS avg_prs,
               ROUND(AVG(cgpa)::numeric, 2) AS avg_cgpa,
               COUNT(*) AS count
        FROM students
        WHERE branch IS NOT NULL AND year IS NOT NULL
        GROUP BY branch, year
    """)

    recommendations = []
    for r in rows:
        avg_prs = float(r["avg_prs"])
        avg_cgpa = float(r["avg_cgpa"])
        branch = r["branch"]
        year = r["year"]

        if avg_prs < 50:
            recommendations.append({
                "title": f"Aptitude + DSA Foundation Training ({branch} {year})",
                "reason": f"Average PRS is weak ({avg_prs})",
                "target_group": {"branch": branch, "year": year},
                "expected_impact": "+10 PRS (estimated)",
            })
        if avg_cgpa < 6.5:
            recommendations.append({
                "title": f"Academic Improvement Mentorship ({branch} {year})",
                "reason": f"Average CGPA is low ({avg_cgpa})",
                "target_group": {"branch": branch, "year": year},
                "expected_impact": "+5 PRS (estimated)",
            })

    return {
        "total_groups": len(rows),
        "recommendations_count": len(recommendations),
        "recommendations": recommendations,
    }


@router.post("/ai-recommendations")
async def ai_recommendations(current_user=Depends(get_current_user)):
    pool = await get_pool()

    rows = await pool.fetch("""
        SELECT CONCAT(year, ' ', branch) AS target_group,
               ROUND(AVG(prs_score)::numeric, 2) AS avg_prs,
               ROUND(AVG(cgpa)::numeric, 2) AS avg_cgpa,
               COUNT(*) AS student_count
        FROM students
        WHERE branch IS NOT NULL AND year IS NOT NULL
        GROUP BY year, branch
    """)

    batch_stats = [dict(r) for r in rows]
    for r in batch_stats:
        r["avg_prs"] = float(r["avg_prs"])
        r["avg_cgpa"] = float(r["avg_cgpa"])
        r["avg_github"] = 0  # Placeholder

    from app.services.groq_service import generate_batch_recommendations
    recommendation_data = generate_batch_recommendations(batch_stats)

    return recommendation_data
