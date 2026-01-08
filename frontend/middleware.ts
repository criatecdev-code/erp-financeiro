import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create Supabase Client to check session
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname;

    // 1. Exclude public assets and api routes (optional, mainly frontend pages matters)
    if (path.startsWith('/_next') || path.startsWith('/static') || path.includes('.')) {
        return response;
    }

    // 2. Define Public Routes
    const publicRoutes = ['/login', '/register', '/auth/callback'];
    const isPublicRoute = publicRoutes.some(r => path.startsWith(r));

    // 3. Logic
    if (!user && !isPublicRoute) {
        // User is not logged in and trying to access protected page -> Redirect to Login
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && path === '/login') {
        // User is logged in and trying to access login -> Redirect to Dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
