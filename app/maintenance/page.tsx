"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
    const router = useRouter();

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
                            className="mb-4 rounded-full bg-blue-100 p-3"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Site Maintenance
                        </h1>
                        <p className="text-gray-600">
                            We're currently performing scheduled maintenance.
                        </p>
                    </CardHeader>
                    <CardBody className="flex flex-col items-center space-y-4 pt-2">
                        <p className="text-center text-sm text-gray-500">
                            Our team is working hard to improve your experience. We&apos;ll be back
                            online shortly. Thank you for your patience!
                        </p>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                color="primary"
                                onClick={() => router.refresh()}
                                className="font-medium"
                            >
                                Try Again
                            </Button>
                        </motion.div>
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    );
} 