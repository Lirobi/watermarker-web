import { hasUserPaid } from "@/lib/payment";
import { redirect } from "next/navigation";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const hasPaid = await hasUserPaid();
    if (!hasPaid) {
        redirect("/pricing");
    }
    return (
        <div>
            {children}
        </div>
    );
}