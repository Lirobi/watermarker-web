import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

/**
 * Check if the current user has paid for the service
 * @returns {Promise<boolean>} True if the user has paid, false otherwise
 */
export async function hasUserPaid(): Promise<boolean> {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return false;
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { payment: true },
        });

        return user?.payment?.status === 'PAID';
    } catch (error) {
        console.error('Error checking payment status:', error);
        return false;
    }
} 