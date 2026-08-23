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

    // 4. Set session token cookie and redirect
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
    console.error("Google OAuth callback error:", err);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", err.message || "Google authentication failed.");
    return NextResponse.redirect(loginUrl);
  }
}
