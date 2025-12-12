import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' },
    });

    return NextResponse.json(settings);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
