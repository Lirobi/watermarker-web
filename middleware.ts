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

    // Run both operations in parallel using Promise.all
    try {
        const promises = [];
        const redirectUrls: (URL | null)[] = [];

        if (!pathname.startsWith('/api')) {
            // Promise for checking maintenance mode
            const maintenancePromise = fetch(new URL('/api/settings', request.url))
                .then(res => res.json())
                .then(settings => {
                    if (settings?.maintenanceMode && token?.role !== "ADMIN") {
                        return new URL("/maintenance", request.url);
                    }
                    return null;
                })
                .catch(error => {
                    console.error("Error checking maintenance mode:", error);
                    return null;
                });

            promises.push(maintenancePromise);
            redirectUrls.push(null); // Placeholder for maintenance redirect

            // Check for payment status if accessing watermarker page
            if (isWatermarkerPage) {
                if (!token) {
                    // If not logged in, redirect to login
                    return NextResponse.redirect(new URL('/auth/signin', request.url));
                }

                const paymentPromise = fetch(new URL('/api/user/payment-status', request.url))
                    .then(res => {
                        if (!res.ok) {
                            console.error(`Error checking payment status: ${res.status} ${res.statusText}`);
                            return { hasPaid: false, error: `HTTP error ${res.status}` };
                        }
                        return res.json();
                    })
                    .then(data => {
                        console.log("Payment status response:", data);
                        // Only redirect if explicitly confirmed user has not paid
                        if (data && data.hasPaid === false) {
                            return new URL("/pricing?access=denied", request.url);
                        }
                        // Don't redirect if paid or if response is unclear
                        return null;
                    })
                    .catch(error => {
                        console.error("Error checking payment status:", error);
                        // Don't redirect on error - better to let users try than block incorrectly
                        return null;
                    });


                promises.push(paymentPromise);
                redirectUrls.push(null); // Placeholder for payment redirect
            }

            // Promise for updating analytics (only if user is logged in)
            if (token?.sub) {
                const userAgent = request.headers.get("user-agent") || "";
                const ip = request.headers.get("x-forwarded-for") || "";

                const analyticsPromise = fetch(new URL('/api/analytics/update', request.url), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: token.sub,
                        ipAddress: ip,
                        device: userAgent,
                        country: "Unknown", // In production, use a geolocation service
                        city: "Unknown",
                    }),
                })
                    .catch(error => {
                        console.error("Error updating user analytics:", error);
                        return null;
                    });

                promises.push(analyticsPromise);
            }

            // Wait for all promises to resolve
            const results = await Promise.all(promises);

            // Extract redirect URLs from results
            const maintenanceRedirectUrl = results[0] as URL | null;
            const paymentRedirectUrl = isWatermarkerPage ? results[1] as URL | null : null;

            // If maintenance mode is active and user is not admin, redirect
            if (maintenanceRedirectUrl) {
                return NextResponse.rewrite(maintenanceRedirectUrl.toString());
            }

            // If payment check failed and user is trying to access watermarker, redirect
            if (isWatermarkerPage && paymentRedirectUrl) {
                return NextResponse.redirect(paymentRedirectUrl.toString());
            }
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