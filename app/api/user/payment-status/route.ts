import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { hasPaid: false, error: 'Not authenticated' },
                { status: 401 }
            );
        } else {
            console.log(session.user);
        }

        if (!session.user.id) {
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
            return NextResponse.json(
                { hasPaid: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const hasPaid = user.payment?.status === 'PAID';

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

        const { userId, status } = await req.json();
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { payment: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { payment: { update: { status: status } } },
        });

        return NextResponse.json({ user: user }, { status: 200 });
    } catch (error) {
        console.error("Error checking payment status:", error);
    }
}