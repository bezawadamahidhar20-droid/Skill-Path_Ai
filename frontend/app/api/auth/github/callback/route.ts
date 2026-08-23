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

    // 5. Set session token cookie and redirect
    const destination = authData.onboarding_completed ? "/dashboard" : "/onboarding";
    const redirectResponse = NextResponse.redirect(new URL(destination, request.url));

    redirectResponse.cookies.set("token", authData.access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return redirectResponse;
  } catch (err: any) {
    console.error("GitHub OAuth callback error:", err);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", err.message || "GitHub authentication failed.");
    return NextResponse.redirect(loginUrl);
  }
}
