import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma) as any, // Type cast to avoid adapter type issues
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role
                };
            }
        })
    ],
    callbacks: {
        async session({ session, user, token }) {
            // Add user role to session
            if (session.user) {
                // For JWT strategy, user comes from token
                if (token) {
                    session.user.id = token.sub!;
                    session.user.role = token.role as any;
                }
                // For database strategy, user comes from adapter
                else if (user) {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: user.id },
                        include: { payment: true, userAnalytics: true }
                    });

                    if (!dbUser) {
                        console.error(`User not found in database: ${user.id}`);
                    } else {
                        session.user.id = user.id;
                        session.user.role = dbUser?.role || "USER";

                        // Check if user is admin
                        console.log(dbUser?.email);
                        if (dbUser?.email === "lilian.bischung@gmail.com") {
                            try {
                                // Create or update the payment record
                                await prisma.user.update({
                                    where: { id: user.id },
                                    data: {
                                        role: "ADMIN",
                                        payment: {
                                            upsert: {
                                                create: { status: "PAID" },
                                                update: { status: "PAID" }
                                            }
                                        }
                                    },
                                });
                                session.user.role = "ADMIN";
                            } catch (err) {
                                console.error('Error updating admin status:', err);
                            }
                        }
                    }
                }
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async signIn({ user, account, profile }) {
            try {
                // Only proceed if we have a valid user ID
                if (user?.id) {
                    // First check if the user exists in the database
                    const dbUser = await prisma.user.findUnique({
                        where: { id: user.id },
                        include: { userAnalytics: true }
                    });

                    // Only proceed if the user exists in the database
                    if (dbUser) {
                        // If user already has analytics, update them
                        if (dbUser.userAnalytics) {
                            await prisma.userAnalytics.update({
                                where: { userId: user.id },
                                data: {
                                    lastVisit: new Date(),
                                    visitCount: dbUser.userAnalytics.visitCount + 1,
                                },
                            });
                        } else {
                            // If user doesn't have analytics, create them
                            await prisma.userAnalytics.create({
                                data: {
                                    userId: user.id,
                                    lastVisit: new Date(),
                                    visitCount: 1
                                },
                            });
                        }
                    }
                    // If user doesn't exist yet, we'll skip analytics for now
                    // They'll be created on the next sign-in when the user record exists
                }
            } catch (error) {
                // Log the error but don't block sign-in
                console.error("Error updating user analytics:", error);
            }

            // Always return true to allow sign-in to proceed
            return true;
        }
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
}; 