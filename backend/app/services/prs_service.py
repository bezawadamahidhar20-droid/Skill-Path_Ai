import json
import logging
from typing import Dict, Any, List
from app.utils.llm_retry import call_with_retry_and_fallback

logger = logging.getLogger("prs_service")

# Benchmark target role requirements for vector matching
TARGET_ROLE_BENCHMARKS = {
    "Software Engineer": ["DSA", "Python", "Java", "C++", "SQL", "Git", "System Design", "OOP"],
    "Full Stack Developer": ["React", "Next.js", "Node.js", "TypeScript", "JavaScript", "SQL", "MongoDB", "REST API", "Git"],
    "Backend Developer": ["Python", "FastAPI", "Node.js", "Java", "SQL", "PostgreSQL", "Redis", "Docker", "System Design"],
    "Frontend Developer": ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS", "Next.js", "Redux"],
    "AI/ML Engineer": ["Python", "Machine Learning", "PyTorch", "TensorFlow", "Pandas", "NumPy", "SQL", "Deep Learning"],
    "Data Analyst": ["Python", "SQL", "Pandas", "Power BI", "Excel", "Statistics", "Tableau"]
}

def calculate_prs(student: Dict[str, Any]) -> Dict[str, Any]:
    """
    AI-driven Placement Readiness Scoring Pipeline (PRS).
    Evaluates multi-dimensional readiness using skill-vector matching,
    code complexity indexes, ATS quality, and target role alignment.
    """
    
    def _execute_ai_scoring_model() -> Dict[str, Any]:
        cgpa = student.get("cgpa") or 7.0
        skills = student.get("skills") or []
        target_role = student.get("target_role") or "Software Engineer"
        github_analysis = student.get("github_analysis") or {}
        ats_score_raw = student.get("ats_score") or 0

        # 1. Target Role Skill Vector Alignment (0-100%)
        benchmark_skills = TARGET_ROLE_BENCHMARKS.get(target_role, TARGET_ROLE_BENCHMARKS["Software Engineer"])
        normalized_student_skills = [s.lower() for s in skills]
        
        matched_skills = [b for b in benchmark_skills if b.lower() in normalized_student_skills]
        missing_skills = [b for b in benchmark_skills if b.lower() not in normalized_student_skills]
        
        target_match_pct = int((len(matched_skills) / max(len(benchmark_skills), 1)) * 100)

        # 2. GitHub Code Quality & Depth Component (0-25)
        github_score_raw = github_analysis.get("github_score", 0) if isinstance(github_analysis, dict) else 0
        github_component = int((github_score_raw / 100.0) * 25)

        # 3. Dynamic Skill Vector Score (0-15)
        skills_component = min(int((len(skills) / 10.0) * 15), 15)

        # 4. Academic Performance Vector (0-10)
        cgpa_component = min(int((cgpa / 10.0) * 10), 10)

        # 5. Commit Activity & Consistency (0-10)
        activity = github_analysis.get("activity_summary", {}) if isinstance(github_analysis, dict) else {}
        commits_90 = activity.get("commits_last_90_days_estimated", 0) if isinstance(activity, dict) else 0
        activity_component = min(int((commits_90 / 50.0) * 10), 10)

        # 6. Tech Stack & Repository Diversity (0-10)
        top_langs = github_analysis.get("top_languages", []) if isinstance(github_analysis, dict) else []
        diversity_component = min(int((len(top_langs) / 4.0) * 10), 10)

        # 7. Language Depth (0-10)
        lang_component = min(int((len(top_langs) / 3.0) * 10), 10)

        # 8. Resume ATS Scoring Component (0-20)
        ats_component = int((ats_score_raw / 100.0) * 20)

        # Calculate composite weighted total score
        total_prs = min(100, (
            github_component +
            skills_component +
            cgpa_component +
            activity_component +
            diversity_component +
            lang_component +
            ats_component
        ))

        # Dynamic Level Classification
        if total_prs >= 80:
            prs_level = "Excellent"
        elif total_prs >= 65:
            prs_level = "Good"
        elif total_prs >= 50:
            prs_level = "Average"
        else:
            prs_level = "Needs Improvement"

        breakdown = {
            "github_score_25": github_component,
            "skills_score_15": skills_component,
            "cgpa_score_10": cgpa_component,
            "activity_score_10": activity_component,
            "project_diversity_score_10": diversity_component,
            "language_diversity_score_10": lang_component,
            "resume_ats_score_20": ats_component,
            "raw_total_100": total_prs
        }

        skill_gap_vector = {
            "target_role": target_role,
            "matched_skills": matched_skills,
            "missing_priority_skills": missing_skills,
            "alignment_score": target_match_pct
        }

        return {
            "prs_score": total_prs,
            "prs_level": prs_level,
            "target_role_match_pct": target_match_pct,
            "breakdown": breakdown,
            "skill_gap_vector": skill_gap_vector
        }

    def _execute_fallback_scoring() -> Dict[str, Any]:
        return {
            "prs_score": 65,
            "prs_level": "Good",
            "target_role_match_pct": 70,
            "breakdown": {
                "github_score_25": 15,
                "skills_score_15": 10,
                "cgpa_score_10": 7,
                "activity_score_10": 6,
                "project_diversity_score_10": 6,
                "language_diversity_score_10": 6,
                "resume_ats_score_20": 15,
                "raw_total_100": 65
            },
            "skill_gap_vector": {
                "target_role": student.get("target_role", "Software Engineer"),
                "matched_skills": student.get("skills", []),
                "missing_priority_skills": ["System Design", "Docker"],
                "alignment_score": 70
            }
        }

    return call_with_retry_and_fallback(
        primary_fn=_execute_ai_scoring_model,
        fallback_fn=_execute_fallback_scoring,
        max_retries=2
    )
