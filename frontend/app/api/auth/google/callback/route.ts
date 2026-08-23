import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  if (errorParam || !code) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Google authentication cancelled or failed.");
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "error",
      "Google OAuth credentials (GOOGLE_CLIENT_SECRET) missing in server environment."
    );
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 1. Exchange auth code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Failed to retrieve access token from Google.");
    }

    // 2. Fetch real user profile from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();
    if (!userRes.ok || !googleUser.email) {
      throw new Error("Unable to retrieve Google user profile.");
    }

    // 3. Register or authenticate with backend
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const authRes = await fetch(`${backendUrl}/api/auth/oauth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "google",
        provider_account_id: String(googleUser.id),
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split("@")[0],
        avatar_url: googleUser.picture || null,
      }),
    });

    const authData = await authRes.json();
    if (!authRes.ok || !authData.access_token) {
      throw new Error(authData.detail || "Failed to authenticate with backend.");
    }

    // 4. Set session token cookie & localStorage script for smooth browser linking
    const destination = authData.onboarding_completed ? "/dashboard" : "/onboarding";

    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Connecting Google Account...</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b;">
    <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); max-width: 400px; width: 90%;">
      <div style="width: 48px; height: 48px; border: 4px solid #3b82f6; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem auto;"></div>
      <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">Google Account Linked!</h3>
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
    console.error("Google OAuth callback error:", err);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", err.message || "Google authentication failed.");
    return NextResponse.redirect(loginUrl);
  }
}
