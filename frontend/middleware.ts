import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = [
    '/dashboard',
    '/student',
    '/admin',
    '/onboarding',
]

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Get token from cookies or check localStorage (we'll use a workaround)
    const token = request.cookies.get('token')?.value

    // Check if the current route is protected
    // Exclude /admin/login from protection since it's an auth route
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route) && !pathname.startsWith('/admin/login')
    )

    // Check if the current route is an auth route
    const isAuthRoute = authRoutes.some(route =>
        pathname.startsWith(route)
    )

    // If accessing protected route without token, redirect to login
    if (isProtectedRoute && !token) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // If accessing auth route with valid token, redirect to dashboard
    // (Optional: prevents logged-in users from seeing login page)
    if (isAuthRoute && token) {
        const dashboardUrl = new URL('/dashboard', request.url)
        return NextResponse.redirect(dashboardUrl)
    }

    return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
}
