import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices


export async function middleware(request: NextRequest) {
    // Get token early to avoid multiple calls
    const token = await getToken({ req: request });
    const { pathname } = request.nextUrl;

    // Check if the request is for the watermarker page
    const isWatermarkerPage = pathname.startsWith('/watermarker');
    // Check if the request is for the dashboard page (which contains the watermarker tool)
    const isDashboardPage = pathname.startsWith('/dashboard');

    try {
        // Check maintenance mode using environment variable
        // This avoids issues with Prisma in Edge Runtime
        const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
        if (maintenanceMode && token?.role !== "ADMIN" && !pathname.startsWith('/api') && !pathname.startsWith('/maintenance')) {
            return NextResponse.rewrite(new URL("/maintenance", request.url));
        }

        // Check for payment status if accessing watermarker or dashboard page
        if ((isWatermarkerPage || isDashboardPage) && !pathname.startsWith('/api')) {
            if (!token) {
                // If not logged in, redirect to login
                return NextResponse.redirect(new URL('/auth/signin', request.url));
            }

            // Note: Payment validation is now handled at the API route level
            // to avoid Edge Runtime limitations with Prisma
            // The middleware only checks authentication
        }
    } catch (error) {
        console.error("Error in middleware:", error);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - maintenance (maintenance page)
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico|maintenance).*)",
    ],
}; 