from typing import Dict, List
import re


# Skill synonym mapping for fuzzy matching
SKILL_SYNONYMS = {
    "nodejs": "node.js",
    "node": "node.js",
    "reactjs": "react",
    "react.js": "react",
    "nextjs": "next.js",
    "next": "next.js",
    "ts": "typescript",
    "js": "javascript",
    "py": "python",
    "c sharp": "c#",
    "csharp": "c#",
    "postgres": "sql",
    "postgresql": "sql",
    "mysql": "sql",
    "mongo": "mongodb",
    "k8s": "docker",
    "gcp": "cloud",
    "amazon web services": "aws",
}


def normalize_skill(skill: str) -> str:
    """Normalize a skill name for comparison."""
    s = skill.strip().lower()
    s = SKILL_SYNONYMS.get(s, s)
    # Remove common variations like "react.js" -> "react" if not in synonyms
    s = s.replace(".js", "js") if s.endswith(".js") and s not in SKILL_SYNONYMS.values() else s
    return s


def match_student_with_companies(student: dict, companies: List[dict]) -> Dict:
    """
    Returns:
    {
        "student": {...basic info...},
        "matches": [
            {
              "company_name": "...",
              "role": "...",
              "tier": "...",
              "eligible": True/False,
              "missing_cgpa": True/False,
              "missing_skills": [...],
              "match_percent": int
            }
        ]
    }
    """

    student_branch = (student.get("branch") or "").upper()
    student_year = (student.get("year") or "").upper()
    student_cgpa = student.get("cgpa", 0)
    student_skills = set(normalize_skill(s) for s in student.get("skills", []))

    results = []

    for company in companies:
        company_name = company.get("company_name")
        role = company.get("role")
        tier = company.get("tier")

        # Use the correct DB column names
        eligible_branches = [b.upper() for b in company.get("eligible_branches", [])]
        eligible_years = [y.upper() for y in company.get("eligible_years", [])]
        min_cgpa = company.get("min_cgpa", 0)

        required_skills = [normalize_skill(s) for s in company.get("required_skills", [])]

        # ---------------- Branch Check ----------------
        branch_allowed = not eligible_branches or student_branch in eligible_branches

        # ---------------- Year Check ----------------
        year_allowed = not eligible_years or student_year in eligible_years

        # ---------------- CGPA Check ----------------
        cgpa_ok = student_cgpa is not None and student_cgpa >= min_cgpa

        # ---------------- Skills Check (case-insensitive + synonym-aware) ----------------
        missing_required_skills = []
        for skill in required_skills:
            if skill not in student_skills:
                missing_required_skills.append(skill)

        required_ok = len(missing_required_skills) == 0

        # ---------------- Eligibility ----------------
        eligible = branch_allowed and year_allowed and cgpa_ok and required_ok

        # ---------------- Match Percent ----------------
        total_skills = len(required_skills)
        matched_skills = sum(1 for s in required_skills if s in student_skills)

        if total_skills == 0:
            match_percent = 100
        else:
            match_percent = int((matched_skills / total_skills) * 100)

        results.append({
            "company_name": company_name,
            "role": role,
            "tier": tier,
            "eligible": eligible,
            "branch_allowed": branch_allowed,
            "year_allowed": year_allowed,
            "cgpa_required": min_cgpa,
            "student_cgpa": student_cgpa,
            "cgpa_ok": cgpa_ok,
            "missing_required_skills": missing_required_skills,
            "match_percent": match_percent
        })

    # sort by match %
    results.sort(key=lambda x: x["match_percent"], reverse=True)

    return {
        "student": {
            "name": student.get("name"),
            "email": student.get("email"),
            "branch": student.get("branch"),
            "year": student.get("year"),
            "cgpa": student.get("cgpa"),
            "skills": student.get("skills", [])
        },
        "matches": results
    }
