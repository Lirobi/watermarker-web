"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    let errorMessage = "An error occurred during authentication.";
    if (error === "AccessDenied") {
        errorMessage = "Access denied. You do not have permission to sign in.";
    } else if (error === "Configuration") {
        errorMessage = "There is a problem with the server configuration.";
    } else if (error === "Verification") {
        errorMessage = "The verification link has expired or has already been used.";
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="border border-blue-100 bg-white/80 backdrop-blur-md">
                    <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2 text-center">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 100,
                                delay: 0.2
                            }}
                            className="mb-4 rounded-full bg-red-100 p-3"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 text-red-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Authentication Error
                        </h1>
                    </CardHeader>
                    <CardBody className="flex flex-col items-center space-y-4 pt-2">
                        <p className="text-center text-sm text-gray-500">
                            {errorMessage}
                        </p>
                        <div className="flex gap-3">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    color="primary"
                                    onClick={() => router.push("/auth/signin")}
                                    className="font-medium"
                                >
                                    Try Again
                                </Button>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    color="default"
                                    onClick={() => router.push("/")}
                                    className="font-medium"
                                >
                                    Go Home
                                </Button>
                            </motion.div>
                        </div>
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="w-full max-w-md">
                    <Card className="border border-blue-100 bg-white/80 backdrop-blur-md">
                        <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2 text-center">
                            <div className="mb-4 rounded-full bg-red-100 p-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-10 w-10 text-red-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Authentication Error
                            </h1>
                        </CardHeader>
                        <CardBody className="flex flex-col items-center space-y-4 pt-2">
                            <p className="text-center text-sm text-gray-500">
                                Loading error details...
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </div>
        }>
            <AuthErrorContent />
        </Suspense>
    );
} 