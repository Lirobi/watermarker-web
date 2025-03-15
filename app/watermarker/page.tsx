"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/spinner";

export default function WatermarkerPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to dashboard (which contains the watermarker tool)
        router.push("/dashboard");
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <Spinner size="lg" color="primary" />
                <p className="mt-4">Redirecting to Watermarker Tool...</p>
            </div>
        </div>
    );
} 