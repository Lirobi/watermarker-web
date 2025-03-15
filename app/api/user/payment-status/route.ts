import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.log("GET payment-status: No session or user");
            return NextResponse.json(
                { hasPaid: false, error: 'Not authenticated' },
                { status: 401 }
            );
        } else {
            console.log("GET payment-status user:", session.user.email, session.user.id);
        }

        if (!session.user.id) {
            console.log("GET payment-status: No user ID in session");
            return NextResponse.json(
                { hasPaid: false, error: 'User ID not found in session' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { payment: true },
        });

        if (!user) {
            console.log(`GET payment-status: User not found with ID ${session.user.id}`);
            return NextResponse.json(
                { hasPaid: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user is ADMIN - admins always have access
        if (user.role === 'ADMIN') {
            console.log(`GET payment-status: User ${user.email} is ADMIN, granting access`);
            return NextResponse.json({ hasPaid: true });
        }

        // Check payment status
        const hasPaid = user.payment?.status === 'PAID';
        console.log(`GET payment-status: User ${user.email} payment status: ${hasPaid ? 'PAID' : 'UNPAID'}`);

        return NextResponse.json({ hasPaid });
    } catch (error) {
        console.error('Error checking payment status:', error);
        return NextResponse.json(
            { hasPaid: false, error: 'Failed to check payment status' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { userId, status } = body;

        // Validate required parameters
        if (!userId || !status) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        // Validate status value
        if (status !== "PAID" && status !== "UNPAID") {
            return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { payment: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If payment record doesn't exist, create it; otherwise update it
        let updatedUser;
        if (!user.payment) {
            updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    payment: {
                        create: { status: status }
                    }
                },
                include: { payment: true }
            });
        } else {
            updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    payment: {
                        update: { status: status }
                    }
                },
                include: { payment: true }
            });
        }

        return NextResponse.json({ user: updatedUser }, { status: 200 });
    } catch (error) {
        console.error("Error updating payment status:", error);
        return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 });
    }
}