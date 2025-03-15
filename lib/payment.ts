import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Check if the current user has paid for the service
 * @returns {Promise<boolean>} True if the user has paid, false otherwise
 */
export async function hasUserPaid(): Promise<boolean> {
    try {
        // Use authOptions to ensure consistent session handling in all environments
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.log("hasUserPaid: No session or user");
            return false;
        }

        // Try to find user by ID first (more reliable)
        if (session.user.id) {
            console.log(`hasUserPaid: Looking up user by ID: ${session.user.id}`);
            const userById = await prisma.user.findUnique({
                where: { id: session.user.id },
                include: { payment: true },
            });

            if (userById) {
                console.log(`hasUserPaid: User found by ID, payment status: ${userById.payment?.status || 'no payment record'}`);
                return userById.payment?.status === 'PAID';
            }
        }

        // Fallback to finding by email
        if (session.user.email) {
            console.log(`hasUserPaid: Looking up user by email: ${session.user.email}`);
            const userByEmail = await prisma.user.findUnique({
                where: { email: session.user.email },
                include: { payment: true },
            });

            if (userByEmail) {
                console.log(`hasUserPaid: User found by email, payment status: ${userByEmail.payment?.status || 'no payment record'}`);
                return userByEmail.payment?.status === 'PAID';
            }
        }

        console.log("hasUserPaid: User not found in database");
        return false;
    } catch (error) {
        console.error('Error checking payment status:', error);
        return false;
    }
} 