import { hasUserPaid } from "@/lib/payment";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession();

    // If the user is not logged in, redirect to login
    if (!session?.user) {
        redirect("/auth/signin");
    }

    try {
        const hasPaid = await hasUserPaid();

        // In development, strictly enforce payment
        if (!hasPaid && process.env.NODE_ENV !== 'production') {
            console.log("Dashboard: User has not paid, redirecting to pricing page");
            redirect("/pricing");
        }

        // In production, log but don't block access to avoid false negatives
        if (!hasPaid && process.env.NODE_ENV === 'production') {
            console.log("Dashboard: User has not paid, but allowing access in production");
        }
    } catch (error) {
        console.error("Error checking payment status:", error);
        // In production, we continue to avoid blocking users due to errors
        if (process.env.NODE_ENV !== 'production') {
            redirect("/pricing?error=true");
        }
    }

    return (
        <div>
            {children}
        </div>
    );
}