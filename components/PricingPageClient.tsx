'use client';

import { title } from "@/components/primitives";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { CheckIcon } from "@/components/icons";
import { Session } from "next-auth";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Dynamically import the client component with no SSR
const ButtonCheckout = dynamic(() => import("@/components/ButtonCheckout"), { ssr: false });

interface PricingPageClientProps {
    session: Session | null;
    hasPaid: boolean;
    accessDenied: boolean;
    paymentCanceled: boolean;
    paymentSuccess: boolean;
    product: {
        name: string;
        description: string;
        price: number;
    };
}

export default function PricingPageClient({
    session,
    hasPaid,
    accessDenied,
    paymentCanceled,
    paymentSuccess,
    product
}: PricingPageClientProps) {
    return (
        <div className="min-h-screen">
            {/* Pricing Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-24 md:py-32">
                <div className="absolute inset-0 z-0 opacity-30">
                    <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
                </div>

                <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
                            Simple, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Transparent</span> Pricing
                        </h1>
                        <p className="mb-10 text-xl text-gray-700">
                            Get lifetime access to our premium watermarking tool for a one-time payment.
                        </p>
                    </motion.div>

                    {accessDenied && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="mx-auto mb-10 max-w-2xl rounded-lg bg-danger-50 p-4 text-danger shadow-sm"
                        >
                            <div className="flex items-start">
                                <svg className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                </svg>
                                <p className="font-medium">
                                    Access denied. You need to purchase the premium plan to access the watermarker tool.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {paymentCanceled && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="mx-auto mb-10 max-w-2xl rounded-lg bg-warning-50 p-4 text-warning shadow-sm"
                        >
                            <div className="flex items-start">
                                <svg className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                </svg>
                                <p className="font-medium">
                                    Your payment was canceled. You can try again when you&apos;re ready.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {paymentSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="mx-auto mb-10 max-w-2xl rounded-lg bg-success-50 p-4 text-success shadow-sm"
                        >
                            <div className="flex items-start">
                                <svg className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                </svg>
                                <p className="font-medium">
                                    Thank you for your purchase! You now have access to the watermarker tool.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mx-auto max-w-lg"
                    >
                        <Card className="overflow-hidden border border-gray-200 bg-white/90 shadow-xl backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white flex flex-col gap-4">
                                <div className="flex justify-between items-center gap-4">
                                    <h3 className="text-2xl font-bold">{product.name}</h3>
                                    <span className="rounded-full bg-white/20 px-3 py-2 text-xs font-medium">
                                        LIFETIME ACCESS
                                    </span>
                                </div>
                                <div className="mt-4 flex items-baseline">
                                    <span className="text-5xl font-extrabold">${product.price}</span>
                                    <span className="ml-2 text-lg opacity-90">one-time payment</span>
                                </div>
                            </CardHeader>
                            <Divider />
                            <CardBody className="p-8">
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-blue-500" />
                                        <span className="text-gray-700">Lifetime access to the watermarker tool</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-blue-500" />
                                        <span className="text-gray-700">Add text or image watermarks to your photos</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-blue-500" />
                                        <span className="text-gray-700">Customize position, opacity, and scale</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-blue-500" />
                                        <span className="text-gray-700">Download in high quality</span>
                                    </li>
                                </ul>
                            </CardBody>
                            <Divider />
                            <CardFooter className="flex justify-center p-8">
                                {hasPaid ? (
                                    <Button
                                        color="success"
                                        as="a"
                                        href="/pricing" // TODO: Change to /dashboard
                                        size="lg"
                                        className="font-medium px-8 py-6 text-lg"
                                    >
                                        Not avaliable yet
                                    </Button>
                                ) : session ? (
                                    <ButtonCheckout />
                                ) : (
                                    <Button
                                        color="primary"
                                        as="a"
                                        href="/pricing"
                                        //href="/auth/signin?callbackUrl=/pricing"
                                        size="lg"
                                        className="font-medium px-8 py-6 text-lg"
                                    >
                                        Not avaliable yet
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>

                        <div className="mt-8 text-center text-sm text-gray-600">
                            <p className="flex items-center justify-center gap-2">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                                </svg>
                                Secure payment processing by Stripe
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FAQ Section
            <section className="py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="mb-16 text-center"
                    >
                        <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Frequently Asked Questions</h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600">
                            Everything you need to know about our premium watermarking tool
                        </p>
                    </motion.div>

                    <div className="mx-auto max-w-3xl">
                        {[
                            {
                                question: "Is this a subscription or a one-time payment?",
                                answer: "This is a one-time payment of $20 that gives you lifetime access to the premium watermarking tool. There are no recurring charges or hidden fees."
                            },
                            {
                                question: "What features do I get with the premium plan?",
                                answer: "The premium plan includes text and image watermarking, customizable opacity and positioning, batch processing for multiple images, high-quality downloads, and priority customer support."
                            },
                            {
                                question: "Can I try before I buy?",
                                answer: "While we don't offer a free trial of the premium features, you can see examples of watermarked images on our home page to get an idea of the quality and features."
                            },
                            {
                                question: "How do I access the watermarker after purchase?",
                                answer: "After your purchase is complete, you'll be automatically redirected to the watermarker tool. You can also access it anytime by logging into your account and navigating to the Watermarker page."
                            },
                            {
                                question: "Do you offer refunds?",
                                answer: "Yes, we offer a 30-day money-back guarantee if you're not satisfied with the premium features for any reason. Contact our support team to request a refund."
                            }
                        ].map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                            >
                                <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                                <p className="mt-2 text-gray-600">{faq.answer}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
             */}

            {/* CTA Section 
            <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20 text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                            Ready to Protect Your Digital Content?
                        </h2>
                        <p className="mb-8 text-lg opacity-90">
                            Join thousands of creators who trust our watermarking tool to protect their work.
                        </p>
                        {hasPaid ? (
                            <Button
                                color="default"
                                size="lg"
                                as="a"
                                href="/watermarker"
                                className="bg-white font-medium text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg"
                            >
                                Go to Watermarker
                            </Button>
                        ) : session ? (
                            <ButtonCheckout />
                        ) : (
                            <Button
                                color="default"
                                size="lg"
                                as="a"
                                href="/auth/signin?callbackUrl=/pricing"
                                className="bg-white font-medium text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg"
                            >
                                Sign In to Get Started
                            </Button>
                        )}
                    </motion.div>
                </div>
            </section>*/}
        </div>
    );
} 