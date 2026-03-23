import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    const isProtectedRoute = 
        pathname.startsWith('/dashboard') || 
        pathname.startsWith('/transactions') || 
        pathname.startsWith('/categories') ||
        pathname.startsWith('/reports');

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname === '/') {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*', 
        '/transactions/:path*', 
        '/categories/:path*', 
        '/reports/:path*',
        '/login', 
        '/register',
        '/'
    ],
};