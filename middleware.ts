import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

export async function middleware(request: NextRequest) {
    // Check if site is in maintenance mode
    try {
        const settings = await prisma.siteSettings.findUnique({
            where: { id: "settings" },
        });

        if (settings?.maintenanceMode) {
            // Allow admin users to bypass maintenance mode
            const token = await getToken({ req: request });
            if (token?.role !== "ADMIN") {
                return NextResponse.rewrite(new URL("/maintenance", request.url));
            }
        }
    } catch (error) {
        console.error("Error checking maintenance mode:", error);
    }

    // Update user analytics if user is logged in
    const token = await getToken({ req: request });
    if (token?.sub) {
        try {
            const userAgent = request.headers.get("user-agent") || "";
            const ip = request.headers.get("x-forwarded-for") || "";

            // In a production environment, you would use a geolocation service
            // to get country and city from IP address
            const country = "Unknown";
            const city = "Unknown";

            const userAnalytics = await prisma.userAnalytics.findUnique({
                where: { userId: token.sub },
            });

            if (userAnalytics) {
                await prisma.userAnalytics.update({
                    where: { userId: token.sub },
                    data: {
                        ipAddress: ip,
                        device: userAgent,
                        country,
                        city,
                        lastVisit: new Date(),
                    },
                });
            } else {
                await prisma.userAnalytics.create({
                    data: {
                        userId: token.sub,
                        ipAddress: ip,
                        device: userAgent,
                        country,
                        city,
                        lastVisit: new Date(),
                    },
                });
            }
        } catch (error) {
            console.error("Error updating user analytics:", error);
        }
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