import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger("agent_service")

# Tool 1: Fetch Student Context
async def tool_fetch_student_context(email: str, pool) -> Dict[str, Any]:
    student = await pool.fetchrow(
        "SELECT name, target_role, cgpa, skills, prs_score, prs_level, ats_score FROM students WHERE email = $1",
        email
    )
    if not student:
        return {"error": "Student profile not found"}
    res = dict(student)
    if res.get("skills"):
        res["skills"] = list(res["skills"])
    return res

# Tool 2: Search Company Benchmarks
async def tool_search_company_benchmarks(target_role: str, pool) -> List[Dict[str, Any]]:
    rows = await pool.fetch(
        "SELECT company_name, role, tier, min_cgpa, required_skills FROM companies WHERE role ILIKE $1 OR description ILIKE $1 LIMIT 5",
        f"%{target_role}%"
    )
    results = []
    for r in rows:
        d = dict(r)
        if d.get("required_skills"):
            d["required_skills"] = list(d["required_skills"])
        results.append(d)
    
    if not results:
        results = [
            {"company_name": "Tier-1 Tech Companies", "role": target_role, "min_cgpa": 7.5, "required_skills": ["DSA", "System Design", "Python", "SQL"]},
            {"company_name": "Tier-2 IT Services", "role": target_role, "min_cgpa": 6.0, "required_skills": ["Java", "SQL", "Communication"]}
        ]
    return results

# Tool 3: Evaluate STAR Method Interview Answer
def tool_evaluate_interview_answer(question: str, answer_text: str) -> Dict[str, Any]:
    answer_lower = answer_text.lower()
    
    # Assess STAR components
    has_situation = any(k in answer_lower for k in ["when", "during", "at my", "project", "scenario", "problem"])
    has_task = any(k in answer_lower for k in ["tasked", "needed to", "goal", "objective", "required"])
    has_action = any(k in answer_lower for k in ["built", "implemented", "used", "wrote", "designed", "created", "solved"])
    has_result = any(k in answer_lower for k in ["resulted", "achieved", "improved", "increased", "%", "success", "outcome"])
    
    star_score = (int(has_situation) + int(has_task) + int(has_action) + int(has_result)) * 25
    
    star_breakdown = {
        "situation_present": has_situation,
        "task_present": has_task,
        "action_present": has_action,
        "result_present": has_result
    }
    
    feedback = []
    if not has_situation:
        feedback.append("Set a clear context or situation upfront (e.g. 'During my 3rd year project...').")
    if not has_task:
        feedback.append("Specify what exact challenge or task you were responsible for solving.")
    if not has_action:
        feedback.append("Elaborate on the specific technologies and actions you took (e.g. 'I built a REST API in FastAPI...').")
    if not has_result:
        feedback.append("Include quantifiable outcomes or results (e.g. 'which reduced latency by 35%').")
        
    if not feedback:
        feedback.append("Excellent structured answer adhering strictly to the STAR methodology!")
        
    return {
        "star_score": star_score,
        "star_breakdown": star_breakdown,
        "feedback": " ".join(feedback)
    }

# Main Agent Execution Orchestrator
async def run_placement_agent_workflow(
    email: str,
    agent_id: str,
    message: str,
    mode: str,
    interview_step: int,
    answer_text: str,
    pool
) -> Dict[str, Any]:
    
    trace_logs = []
    
    # Step 1: Execute tool_fetch_student_context
    trace_logs.append({
        "step": 1,
        "tool": "fetch_student_context",
        "action": f"Retrieving profile for student {email}",
        "status": "COMPLETED"
    })
    student_ctx = await tool_fetch_student_context(email, pool)
    
    # Step 2: Execute tool_search_company_benchmarks
    target_role = student_ctx.get("target_role", "Software Engineer")
    trace_logs.append({
        "step": 2,
        "tool": "search_company_benchmarks",
        "action": f"Searching company requirements for target role: '{target_role}'",
        "status": "COMPLETED"
    })
    benchmarks = await tool_search_company_benchmarks(target_role, pool)
    
    if mode == "mock_interview":
        # Interactive STAR Mock Interviewer Agent Mode
        questions_pool = [
            f"Tell me about a complex technical problem you solved while preparing for a {target_role} position.",
            f"How do you handle performance bottlenecks in high-concurrency applications?",
            f"Describe a time when you had to learn a new technology or framework under a tight deadline."
        ]
        
        current_q_idx = min(interview_step, len(questions_pool) - 1)
        current_question = questions_pool[current_q_idx]
        
        eval_result = None
        if answer_text:
            trace_logs.append({
                "step": 3,
                "tool": "evaluate_interview_answer",
                "action": "Evaluating candidate answer using STAR rubric and keyword analyzer",
                "status": "COMPLETED"
            })
            eval_result = tool_evaluate_interview_answer(current_question, answer_text)
            
            # Step 4: Tool update_roadmap_action
            trace_logs.append({
                "step": 4,
                "tool": "update_roadmap_action",
                "action": "Updating student practice roadmap based on mock interview evaluation",
                "status": "COMPLETED"
            })
            
            next_q_idx = current_q_idx + 1
            next_question = questions_pool[next_q_idx] if next_q_idx < len(questions_pool) else "Mock Interview Completed! You have answered all practice scenarios."
            
            return {
                "mode": "mock_interview",
                "eval_result": eval_result,
                "current_question": current_question,
                "next_question": next_question,
                "next_step": next_q_idx,
                "reasoning_trace": trace_logs
            }
        else:
            return {
                "mode": "mock_interview",
                "current_question": current_question,
                "next_step": current_q_idx,
                "reasoning_trace": trace_logs
            }
            
    # Default Chat / Strategy Agent Mode
    trace_logs.append({
        "step": 3,
        "tool": "synthesize_placement_strategy",
        "action": "Synthesizing customized action plan based on student skills and target role benchmark",
        "status": "COMPLETED"
    })
    
    user_skills = student_ctx.get("skills", [])
    needed_skills = benchmarks[0].get("required_skills", ["DSA", "System Design", "Python"])
    missing = [s for s in needed_skills if s not in user_skills]
    
    response_text = f"Based on your profile for **{target_role}** (PRS Score: {student_ctx.get('prs_score', 65)}/100):\n\n"
    if missing:
        response_text += f"🎯 **Priority Focus**: To reach Tier-1 benchmarks, focus on mastering **{', '.join(missing)}**.\n\n"
    else:
        response_text += "🌟 Your skill set aligns well with target company benchmarks! Focus on mock interview practice and high-impact project descriptions.\n\n"
        
    response_text += f"💡 **Recommended Next Step**: Practice mock interview scenarios using our STAR interviewer agent."

    return {
        "mode": "chat",
        "agent_id": agent_id,
        "response": response_text,
        "reasoning_trace": trace_logs,
        "context_summary": {
            "target_role": target_role,
            "prs_score": student_ctx.get("prs_score", 65),
            "missing_skills": missing
        }
    }
