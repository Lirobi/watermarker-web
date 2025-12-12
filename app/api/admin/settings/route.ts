import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/settings - Get site settings
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create settings
    let settings = await prisma.siteSettings.findUnique({
      where: {
        id: 'settings',
      },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: 'settings',
          maintenanceMode: false,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PATCH /api/admin/settings - Update site settings
export async function PATCH(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await _request.json();

    // Update settings
    const settings = await prisma.siteSettings.upsert({
      where: {
        id: 'settings',
      },
      update: {
        maintenanceMode: data.maintenanceMode !== undefined ? data.maintenanceMode : undefined,
      },
      create: {
        id: 'settings',
        maintenanceMode: data.maintenanceMode !== undefined ? data.maintenanceMode : false,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
