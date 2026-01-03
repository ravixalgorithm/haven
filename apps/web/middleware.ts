import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check for auth token (adjust cookie name if needed, usually 'token' or from cookies)
    // Since we use client-side storage for this simple app (localStorage), middleware cannot access it easily.
    // HOWEVER, we should use cookies for robust middleware redirects.
    // Assumption: The app functionality in previous turns used localStorage `setToken`. 
    // If we want server-side redirect, we must switch to cookies.

    // Checking if we have a way to check auth.
    // If strictly localStorage, we can't do server-side redirect in middleware.
    // We would need a client component at / to redirect.

    // BUT the user said "all login people should get directed to feed directly".
    // Let's assume for now we use a client-side layout effect or similar if we can't switch to cookies immediately.
    // Or: Update Login to set a cookie as well.

    const token = request.cookies.get('token')?.value;

    if (request.nextUrl.pathname === '/') {
        if (token) {
            return NextResponse.redirect(new URL('/feed', request.url));
        }
    }

    // Protect /snippet/create
    if (request.nextUrl.pathname.startsWith('/snippet/create')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Allow public access to /feed
    // logic removed

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/feed/:path*', '/snippet/create'],
};
