import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname
    const host = request.nextUrl.hostname

    if (host === 'theafricanparent.org') {
        const canonicalUrl = new URL(request.url)
        canonicalUrl.protocol = 'https:'
        canonicalUrl.hostname = 'www.theafricanparent.org'
        return NextResponse.redirect(canonicalUrl, 308)
    }

    if (path === '/admin-dashboard' || path.startsWith('/admin-dashboard/')) {
        const redirectedPath = path.replace('/admin-dashboard', '') || '/'
        return NextResponse.redirect(new URL(redirectedPath, request.url), 308)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
