import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, ipAddress, device, country, city } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userAnalytics = await prisma.userAnalytics.findUnique({
      where: { userId },
    });

    if (userAnalytics) {
      await prisma.userAnalytics.update({
        where: { userId },
        data: {
          ipAddress,
          device,
          country,
          city,
          lastVisit: new Date(),
        },
      });
    } else {
      await prisma.userAnalytics.create({
        data: {
          userId,
          ipAddress,
          device,
          country,
          city,
          lastVisit: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating user analytics:', error);
    return NextResponse.json({ error: 'Failed to update analytics' }, { status: 500 });
  }
}
