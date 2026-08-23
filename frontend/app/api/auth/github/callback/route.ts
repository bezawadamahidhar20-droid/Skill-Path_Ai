import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  if (errorParam || !code) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "GitHub authentication cancelled or failed.");
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "error",
      "GitHub OAuth credentials (GITHUB_CLIENT_SECRET) missing in server environment."
    );
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 1. Exchange auth code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Failed to retrieve access token from GitHub.");
    }

    // 2. Fetch user profile from GitHub API
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "CampusIQ-App",
      },
    });

    const githubUser = await userRes.json();
    if (!userRes.ok || !githubUser.id) {
      throw new Error("Unable to retrieve GitHub user profile.");
    }

    // 3. Resolve user email (fetch from /user/emails if public profile email is missing)
    let email = githubUser.email;
    if (!email) {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "User-Agent": "CampusIQ-App",
        },
      });
      if (emailRes.ok) {
        const emails = await emailRes.json();
        if (Array.isArray(emails)) {
          const primaryEmail = emails.find((e: any) => e.primary && e.verified) || emails[0];
          if (primaryEmail && primaryEmail.email) {
            email = primaryEmail.email;
          }
        }
      }
    }

    if (!email) {
      email = `${githubUser.login}@users.noreply.github.com`;
    }

    const realName = githubUser.name || githubUser.login || email.split("@")[0];

    // 4. Register or authenticate with backend
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const authRes = await fetch(`${backendUrl}/api/auth/oauth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "github",
        provider_account_id: String(githubUser.id),
        email: email,
        name: realName,
        avatar_url: githubUser.avatar_url || null,
      }),
    });

    const authData = await authRes.json();
    if (!authRes.ok || !authData.access_token) {
      throw new Error(authData.detail || "Failed to authenticate with backend.");
    }

    // 5. Set session token cookie & localStorage script for smooth browser linking
    const destination = authData.onboarding_completed ? "/dashboard" : "/onboarding";

    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Connecting GitHub Account...</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b;">
    <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); max-width: 400px; width: 90%;">
      <div style="width: 48px; height: 48px; border: 4px solid #0f172a; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem auto;"></div>
      <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">GitHub Account Linked!</h3>
      <p style="margin: 0; color: #64748b; font-size: 0.875rem;">Setting up your CampusIQ session...</p>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    <script>
      try {
        localStorage.setItem('token', ${JSON.stringify(authData.access_token)});
        localStorage.setItem('role', 'student');
        document.cookie = "token=" + ${JSON.stringify(authData.access_token)} + "; path=/; max-age=604800; SameSite=Lax";
      } catch (e) {
        console.error("Storage error:", e);
      }
      setTimeout(function() {
        window.location.href = ${JSON.stringify(destination)};
      }, 500);
    </script>
  </body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("GitHub OAuth callback error:", err);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", err.message || "GitHub authentication failed.");
    return NextResponse.redirect(loginUrl);
  }
}
