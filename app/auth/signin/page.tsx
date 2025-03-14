"use client";

import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";

function SignInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const registered = searchParams.get("registered") === "true";

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        await signIn("google", { callbackUrl });
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Email and password are required");
            return;
        }

        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
                setIsLoading(false);
            } else {
                router.push(callbackUrl);
            }
        } catch (error) {
            setError("An error occurred during sign in");
            setIsLoading(false);
        }
    };

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
                        <Link href="/" className="mb-2">
                            <Image
                                src="/logo.png"
                                alt="Watermarker Logo"
                                width={40}
                                height={40}
                                className="h-10 w-10"
                            />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Sign In
                        </h1>
                        <p className="text-gray-600">
                            Sign in to access your watermarking tools
                        </p>
                        {registered && (
                            <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-600">
                                Account created successfully! Please sign in.
                            </div>
                        )}
                        {error && (
                            <div className="mt-2 rounded-md bg-red-50 p-2 text-sm text-red-600">
                                {error}
                            </div>
                        )}
                    </CardHeader>
                    <CardBody className="flex flex-col items-center space-y-4 pt-2">
                        <form onSubmit={handleEmailSignIn} className="w-full space-y-4">
                            <Input
                                type="email"
                                label="Email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                variant="bordered"
                            />
                            <Input
                                type="password"
                                label="Password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                variant="bordered"
                            />
                            <Button
                                type="submit"
                                color="primary"
                                className="w-full font-medium"
                                isLoading={isLoading}
                            >
                                Sign In
                            </Button>
                        </form>

                        <div className="flex w-full items-center gap-2">
                            <Divider className="flex-1" />
                            <span className="text-xs text-gray-500">OR</span>
                            <Divider className="flex-1" />
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full"
                        >
                            <Button
                                color="default"
                                onClick={handleGoogleSignIn}
                                className="flex w-full items-center justify-center gap-2 font-medium"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        className="h-5 w-5"
                                    >
                                        <path
                                            fill="#EA4335"
                                            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"
                                        />
                                        <path
                                            fill="#4A90E2"
                                            d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"
                                        />
                                    </svg>
                                )}
                                <span>Sign in with Google</span>
                            </Button>
                        </motion.div>
                    </CardBody>
                    <Divider />
                    <CardFooter className="flex justify-center pt-2">
                        <p className="text-center text-sm text-gray-600">
                            Don't have an account?{" "}
                            <Link href="/auth/signup" className="text-blue-600 hover:underline">
                                Sign Up
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="w-full max-w-md">
                    <Card className="border border-blue-100 bg-white/80 backdrop-blur-md">
                        <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2 text-center">
                            <div className="mb-2">
                                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Sign In
                            </h1>
                            <p className="text-gray-600">
                                Sign in to access your watermarking tools
                            </p>
                        </CardHeader>
                        <CardBody className="flex flex-col items-center space-y-4 pt-2">
                            <div className="w-full space-y-4">
                                <div className="h-10 w-full rounded-md bg-gray-200"></div>
                                <div className="h-10 w-full rounded-md bg-gray-200"></div>
                                <div className="h-10 w-full rounded-md bg-gray-200"></div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        }>
            <SignInContent />
        </Suspense>
    );
} 