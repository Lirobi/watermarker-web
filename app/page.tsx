"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { hasUserPaid } from "@/lib/payment";
import { useEffect, useState } from "react";
export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [hasPaid, setHasPaid] = useState(false);
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const hasPaid = await hasUserPaid();
      setHasPaid(hasPaid);
    }
    checkPaymentStatus();
  }, []);
  const handleGetStarted = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/auth/signin");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
                Protect Your Digital Content with{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Watermarks
                </span>
              </h1>
              <p className="mb-8 text-lg text-gray-700">
                Add professional watermarks to your images and videos in seconds.
                Protect your work, build your brand, and maintain ownership of your content - completely free.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  color="primary"
                  size="lg"
                  onClick={handleGetStarted}
                  className="font-medium"
                >
                  {session && hasPaid ? "Go to Watermarker" : "Get Started"}
                </Button>
                <Button
                  variant="flat"
                  size="lg"
                  as={Link}
                  href="#features"
                  className="font-medium"
                >
                  Learn More
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative mx-auto max-w-md lg:max-w-full"
            >
              <div className="relative rounded-xl bg-white/80 p-2 shadow-xl backdrop-blur-sm">
                <div className="aspect-video overflow-hidden rounded-lg">
                  <div className="relative h-full w-full">
                    <Image
                      src="/demo-image.jpg"
                      alt="Watermark Demo"
                      fill
                      style={{ objectFit: "cover" }}
                      className="rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="rotate-[-20deg] text-4xl font-bold text-white opacity-70">
                        WATERMARK
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 -z-10 h-full w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Powerful Watermarking Features
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Our free tool provides everything you need to protect and brand your digital content
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Text & Image Watermarks",
                description: "Add custom text or upload your logo as a watermark",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                title: "Drag & Position",
                description: "Easily position your watermark with intuitive drag controls",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                ),
              },
              {
                title: "Customizable Opacity",
                description: "Adjust transparency to balance visibility and subtlety",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                ),
              },
              {
                title: "Save & Reuse",
                description: "Save your watermarks for quick application to future content",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                ),
              },
              {
                title: "Image & Video Support",
                description: "Watermark both images and videos with the same easy interface",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                title: "Secure & Private",
                description: "Your content never leaves your browser - maximum privacy",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border border-gray-200 bg-white/80 backdrop-blur-sm">
                  <CardBody className="flex flex-col items-center p-6 text-center">
                    <div className="mb-4 rounded-full bg-blue-100 p-3">
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20 text-white">
        <div className="container mx-auto px-4">
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
              Join thousands of creators who trust our free watermarking tool to protect their work.
            </p>
            <Button
              color="default"
              size="lg"
              onClick={handleGetStarted}
              className="bg-white font-medium text-blue-600 hover:bg-gray-100"
            >
              {session ? "Go to Watermarker" : "Get Started - It's Free"}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
