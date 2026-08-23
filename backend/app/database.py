import asyncpg
import os
from app.config import DATABASE_URL

# Connection pool - lazy initialized
_pool: asyncpg.Pool = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
        await init_db(_pool)
    return _pool


async def init_db(pool: asyncpg.Pool):
    """Create tables if they don't exist."""
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                year VARCHAR(50),
                branch VARCHAR(100),
                cgpa FLOAT,
                skills TEXT[] DEFAULT '{}',
                skills_with_levels JSONB DEFAULT '[]',
                linkedin_url TEXT,
                github_url TEXT,
                avatar_url TEXT,
                provider VARCHAR(50) DEFAULT 'credentials',
                provider_id VARCHAR(255),
                onboarding_completed BOOLEAN DEFAULT FALSE,
                target_role VARCHAR(255) DEFAULT 'Software Engineer',
                role VARCHAR(50) DEFAULT 'student',
                prs_score INTEGER DEFAULT 0,
                prs_level VARCHAR(100),
                prs_breakdown JSONB,
                github_analysis JSONB,
                github_groq_analysis JSONB,
                resume_analysis JSONB,
                ats_score INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Migrations for existing tables
            ALTER TABLE students ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'credentials';
            ALTER TABLE students ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);
            ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS target_role VARCHAR(255) DEFAULT 'Software Engineer';
            ALTER TABLE students ADD COLUMN IF NOT EXISTS skills_with_levels JSONB DEFAULT '[]';
            ALTER TABLE students ALTER COLUMN password DROP NOT NULL;
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS companies (
                id SERIAL PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                role VARCHAR(255),
                tier VARCHAR(50),
                min_cgpa FLOAT DEFAULT 0,
                required_skills TEXT[] DEFAULT '{}',
                eligible_years TEXT[] DEFAULT '{}',
                eligible_branches TEXT[] DEFAULT '{}',
                description TEXT
            );
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255)
            );
        """)

        # Seed an admin account if none exists
        admin_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM admins LIMIT 1)"
        )
        if not admin_exists:
            from app.utils.password_hash import hash_password
            await conn.execute(
                "INSERT INTO admins (email, password, name) VALUES ($1, $2, $3)",
                "admin@campusiq.com",
                hash_password("admin123"),
                "CampusIQ Admin"
            )

        # Seed some companies if none exist
        company_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM companies LIMIT 1)"
        )
        if not company_exists:
            sample_companies = [
                ("Google", "Software Engineer", "Tier-1", 7.0, 
                 ["Python", "Java", "C++", "Go", "JavaScript", "React", "Machine Learning"],
                 ["TY", "FINAL"], ["CSE", "IT", "ECS"], "Leading tech company"),
                ("Microsoft", "Software Development Engineer", "Tier-1", 7.5,
                 ["C#", "Java", "Python", "TypeScript", "Azure", "React"],
                 ["TY", "FINAL"], ["CSE", "IT", "ECS"], "Global technology leader"),
                ("Amazon", "SDE Intern/FTE", "Tier-1", 6.5,
                 ["Java", "Python", "AWS", "React", "Node.js", "SQL"],
                 ["TY", "FINAL"], ["CSE", "IT", "ECS", "ENTC"], "E-commerce and cloud computing giant"),
                ("Infosys", "Systems Engineer", "Tier-2", 5.0,
                 ["Java", "Python", "SQL", "JavaScript", "HTML", "CSS"],
                 ["FINAL"], ["CSE", "IT", "ECS", "ENTC", "MECH"], "IT services company"),
                ("TCS", "IT Trainee", "Tier-2", 5.0,
                 ["Java", "Python", "SQL", "C", "C++", "HTML"],
                 ["FINAL"], ["CSE", "IT", "ECS", "ENTC", "MECH", "CIVIL"], "IT services and consulting"),
                ("Wipro", "Project Engineer", "Tier-2", 5.5,
                 ["Java", "Python", "SQL", "JavaScript", "AWS"],
                 ["FINAL"], ["CSE", "IT", "ECS", "ENTC"], "IT services company"),
                ("Accenture", "Associate Software Engineer", "Tier-2", 5.0,
                 ["Java", "Python", "SQL", "JavaScript", "SAP"],
                 ["FINAL"], ["CSE", "IT", "ECS", "ENTC", "MECH"], "Global professional services"),
                ("Flipkart", "Software Development Engineer", "Tier-1", 7.0,
                 ["Java", "Python", "Kotlin", "React", "Machine Learning"],
                 ["TY", "FINAL"], ["CSE", "IT", "ECS"], "E-commerce platform"),
                ("IBM", "Software Developer", "Tier-2", 6.0,
                 ["Java", "Python", "C++", "Cloud", "React", "AI"],
                 ["TY", "FINAL"], ["CSE", "IT", "ECS", "ENTC"], "Technology and consulting"),
                ("StartupXYZ", "Full Stack Developer", "Tier-3", 6.0,
                 ["React", "Node.js", "Python", "TypeScript", "MongoDB"],
                 ["TY", "FINAL"], ["CSE", "IT"], "Innovative startup"),
            ]
            for company in sample_companies:
                await conn.execute(
                    """INSERT INTO companies (company_name, role, tier, min_cgpa, 
                       required_skills, eligible_years, eligible_branches, description) 
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
                    *company
                )


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
