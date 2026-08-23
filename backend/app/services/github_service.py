import requests
from datetime import datetime, timedelta, timezone
from collections import Counter
from app.config import GITHUB_TOKEN

GITHUB_API = "https://api.github.com"


def github_headers():
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers


def extract_github_username(github_url: str) -> str:
    github_url = github_url.strip().rstrip("/")

    if "github.com/" not in github_url:
        raise ValueError("Invalid GitHub URL")

    username = github_url.split("github.com/")[1].split("/")[0]
    if not username:
        raise ValueError("Invalid GitHub username in URL")

    return username


def fetch_user(username: str):
    url = f"{GITHUB_API}/users/{username}"
    res = requests.get(url, headers=github_headers())

    if res.status_code == 403:
        raise Exception("GitHub API rate limit reached. Please set GITHUB_TOKEN in backend .env or try again later.")
    if res.status_code != 200:
        raise Exception(f"GitHub user fetch failed: {res.text}")

    return res.json()


def fetch_repos(username: str, limit=20):
    url = f"{GITHUB_API}/users/{username}/repos?per_page=100&sort=pushed"
    res = requests.get(url, headers=github_headers())

    if res.status_code == 403:
        raise Exception("GitHub API rate limit reached. Please set GITHUB_TOKEN in backend .env or try again later.")
    if res.status_code != 200:
        raise Exception(f"GitHub repos fetch failed: {res.text}")

    repos = res.json()
    return repos[:limit]


def fetch_languages(username: str, repo_name: str):
    url = f"{GITHUB_API}/repos/{username}/{repo_name}/languages"
    res = requests.get(url, headers=github_headers())

    if res.status_code != 200:
        return {}

    return res.json()


def fetch_readme(username: str, repo_name: str):
    url = f"{GITHUB_API}/repos/{username}/{repo_name}/readme"
    res = requests.get(url, headers=github_headers())

    if res.status_code != 200:
        return ""

    data = res.json()

    # readme is base64 encoded
    if "content" not in data:
        return ""

    import base64
    try:
        decoded = base64.b64decode(data["content"]).decode("utf-8", errors="ignore")
        return decoded
    except:
        return ""


def fetch_commits(username: str, repo_name: str, days=90):
    since_time = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    url = f"{GITHUB_API}/repos/{username}/{repo_name}/commits?per_page=100&since={since_time}"
    res = requests.get(url, headers=github_headers())

    if res.status_code != 200:
        return []

    return res.json()


def detect_project_type(languages: list, readme_text: str, repo_name: str, description: str):
    text = (readme_text + " " + (description or "") + " " + repo_name).lower()
    langs = [l.lower() for l in languages]

    if "next.js" in text or "nextjs" in text:
        return "Web Development Project"
    if "react" in text:
        return "Web Development Project"
    if "firebase" in text:
        return "Web Development Project"

    if "arduino" in text or "esp32" in text or "iot" in text:
        return "IoT / Embedded Project"

    if "machine learning" in text or "random forest" in text or "tensorflow" in text:
        return "Machine Learning Project"

    if "java" in langs and "mysql" in text:
        return "Java + Database Project"

    if "matlab" in text:
        return "MATLAB Simulation Project"

    if "python" in langs:
        return "Python Project"

    if "java" in langs:
        return "Java Project"

    if "c++" in langs or "c" in langs:
        return "C/C++ Project"

    return "General Project"


def extract_keywords_from_readme(readme_text: str):
    keywords = [
        "react", "next", "node", "express", "mongodb", "mysql", "firebase",
        "fastapi", "flask", "django", "api", "rest",
        "arduino", "esp32", "iot",
        "machine learning", "tensorflow", "pytorch",
        "java", "python", "c++", "c", "matlab",
        "tailwind", "bootstrap"
    ]

    found = []
    lower_text = readme_text.lower()

    for k in keywords:
        if k in lower_text:
            found.append(k)

    return list(set(found))


def extract_deployment_links(readme_text: str):
    links = []
    for word in readme_text.split():
        if word.startswith("http://") or word.startswith("https://"):
            cleaned = word.strip("()[]{}<>\"',")
            links.append(cleaned)

    # keep only meaningful links
    filtered = []
    for l in links:
        if "shields.io" in l:
            continue
        if "github-readme-stats" in l:
            continue
        if "streak-stats" in l:
            continue
        if "profile-trophy" in l:
            continue
        filtered.append(l)

    return list(set(filtered))[:5]


def analyze_github_profile(github_url: str):
    username = extract_github_username(github_url)

    user_data = fetch_user(username)
    repos = fetch_repos(username, limit=15)

    overall_languages = Counter()
    project_type_distribution = Counter()

    last_90_days = datetime.now(timezone.utc) - timedelta(days=90)

    repo_analysis = []

    commits_last_90_total = 0
    active_repo_count_90 = 0

    # Only fetch commit data for top 5 repos (big optimization)
    repos_for_commit_check = repos[:5]

    commit_map = {}

    for repo in repos_for_commit_check:
        repo_name = repo["name"]
        commits = fetch_commits(username, repo_name, days=90)
        commit_map[repo_name] = len(commits)

    for repo in repos:
        repo_name = repo["name"]
        description = repo.get("description", "")

        # languages
        languages_dict = fetch_languages(username, repo_name)
        languages_used = list(languages_dict.keys())

        for lang in languages_used:
            overall_languages[lang] += 1

        # readme
        readme_text = fetch_readme(username, repo_name)

        readme_exists = True if readme_text.strip() else False
        stack_detected = extract_keywords_from_readme(readme_text) if readme_exists else []
        deployment_links = extract_deployment_links(readme_text) if readme_exists else []

        project_type = detect_project_type(
            languages=languages_used,
            readme_text=readme_text,
            repo_name=repo_name,
            description=description
        )

        project_type_distribution[project_type] += 1

        pushed_at = repo.get("pushed_at")
        active_in_last_90_days = False

        if pushed_at:
            pushed_time = datetime.fromisoformat(pushed_at.replace("Z", "+00:00"))
            if pushed_time > last_90_days:
                active_repo_count_90 += 1
                active_in_last_90_days = True

        commits_90 = commit_map.get(repo_name, 0)
        commits_last_90_total += commits_90

        repo_analysis.append({
            "repo_name": repo_name,
            "description": description or "",
            "languages_used": languages_used,
            "project_type": project_type,
            "stack_detected": stack_detected,
            "deployment_links": deployment_links,
            "readme_exists": readme_exists,
            "commits_last_90_days_estimated": commits_90,
            "active_in_last_90_days": active_in_last_90_days
        })

    top_languages = [lang for lang, _ in overall_languages.most_common(6)]

    github_score = 0
    github_score += min(user_data.get("public_repos", 0) * 2, 25)
    github_score += min(active_repo_count_90 * 5, 25)
    github_score += min(commits_last_90_total / 2, 25)
    github_score += min(len(top_languages) * 4, 25)

    github_score = int(min(github_score, 100))

    return {
        "username": username,
        "followers": user_data.get("followers", 0),
        "following": user_data.get("following", 0),
        "public_repos": user_data.get("public_repos", 0),
        "top_languages": top_languages,
        "activity_summary": {
            "active_repos_last_90_days": active_repo_count_90,
            "commits_last_90_days_estimated": commits_last_90_total
        },
        "project_type_distribution": dict(project_type_distribution),
        "github_score": github_score,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "repo_analysis": repo_analysis
    }
