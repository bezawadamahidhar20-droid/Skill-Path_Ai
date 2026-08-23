import sys
import os
import pytest

# Add parent dir to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.prs_service import calculate_prs

def test_calculate_prs_basic():
    student_data = {
        "cgpa": 8.5,
        "skills": ["Python", "Java", "SQL", "React", "Git", "DSA"],
        "target_role": "Software Engineer",
        "ats_score": 75,
        "github_analysis": {
            "github_score": 80,
            "top_languages": ["Python", "Java", "TypeScript"],
            "activity_summary": {"commits_last_90_days_estimated": 45}
        }
    }
    result = calculate_prs(student_data)
    assert "prs_score" in result
    assert "prs_level" in result
    assert "target_role_match_pct" in result
    assert "breakdown" in result
    assert 0 <= result["prs_score"] <= 100
    assert result["prs_level"] in ["Excellent", "Good", "Average", "Needs Improvement"]

def test_calculate_prs_edge_cases():
    # Empty profile edge case
    empty_student = {}
    result = calculate_prs(empty_student)
    assert result["prs_score"] >= 0
    assert result["target_role_match_pct"] >= 0

def test_calculate_prs_high_performer():
    high_student = {
        "cgpa": 9.5,
        "skills": ["DSA", "Python", "Java", "C++", "SQL", "Git", "System Design", "OOP"],
        "target_role": "Software Engineer",
        "ats_score": 95,
        "github_analysis": {
            "github_score": 90,
            "top_languages": ["Python", "Java", "C++", "Go"],
            "activity_summary": {"commits_last_90_days_estimated": 120}
        }
    }
    result = calculate_prs(high_student)
    assert result["prs_score"] >= 75
    assert result["prs_level"] in ["Excellent", "Good"]
    assert result["target_role_match_pct"] == 100

if __name__ == "__main__":
    test_calculate_prs_basic()
    test_calculate_prs_edge_cases()
    test_calculate_prs_high_performer()
    print("All PRS unit tests passed successfully!")
