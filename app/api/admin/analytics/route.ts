import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/analytics - Get all user analytics
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users with their analytics
    const users = await prisma.user.findMany({
      include: {
        userAnalytics: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      storageUsed: user.storageUsed,
      analytics: user.userAnalytics
        ? {
            ipAddress: user.userAnalytics.ipAddress,
            device: user.userAnalytics.device,
            country: user.userAnalytics.country,
            city: user.userAnalytics.city,
            lastVisit: user.userAnalytics.lastVisit,
            visitCount: user.userAnalytics.visitCount,
          }
        : null,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching user analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch user analytics' }, { status: 500 });
  }
}
