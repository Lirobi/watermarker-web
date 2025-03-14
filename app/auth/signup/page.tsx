"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function SignUpPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate form
        if (!formData.name || !formData.email || !formData.password) {
            setError("All fields are required");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to sign up");
            }

            // Redirect to sign in page after successful registration
            router.push("/auth/signin?registered=true");
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="border border-blue-100 bg-white/90 backdrop-blur-sm">
                    <CardHeader className="flex flex-col items-center gap-2 pb-0">
                        <Link href="/" className="mb-2">
                            <Image
                                src="/logo.png"
                                alt="Watermarker Logo"
                                width={40}
                                height={40}
                                className="h-10 w-10"
                            />
                        </Link>
                        <h1 className="text-2xl font-bold">Create an Account</h1>
                        <p className="text-center text-sm text-gray-600">
                            Sign up to start watermarking your content
                        </p>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}
                            <div>
                                <Input
                                    label="Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your name"
                                    variant="bordered"
                                    isRequired
                                />
                            </div>
                            <div>
                                <Input
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    variant="bordered"
                                    isRequired
                                />
                            </div>
                            <div>
                                <Input
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create a password"
                                    variant="bordered"
                                    isRequired
                                />
                            </div>
                            <div>
                                <Input
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    variant="bordered"
                                    isRequired
                                />
                            </div>
                            <Button
                                type="submit"
                                color="primary"
                                className="w-full"
                                isLoading={isLoading}
                            >
                                {isLoading ? "Creating Account..." : "Sign Up"}
                            </Button>
                        </form>
                    </CardBody>
                    <Divider />
                    <CardFooter className="flex flex-col gap-4">
                        <p className="text-center text-sm">
                            Already have an account?{" "}
                            <Link href="/auth/signin" className="text-blue-600 hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
} 