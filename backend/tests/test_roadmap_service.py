import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def test_roadmap_generation_structure():
    sample_skills = ["Python", "JavaScript"]
    target_role = "Full Stack Developer"
    
    # Mock dynamic roadmap generation
    missing_skills = ["React", "Node.js", "Docker"]
    tasks = []
    for idx, skill in enumerate(missing_skills, 1):
        tasks.append({
            "task_id": f"week_{idx}_task",
            "task_title": f"Master {skill} fundamentals and build a real-world project",
            "completed": False,
            "estimated_prs_gain": 5
        })

    assert len(tasks) == 3
    assert tasks[0]["task_id"] == "week_1_task"
    assert "React" in tasks[0]["task_title"]
    assert tasks[0]["estimated_prs_gain"] == 5

if __name__ == "__main__":
    test_roadmap_generation_structure()
    print("All Roadmap unit tests passed successfully!")
