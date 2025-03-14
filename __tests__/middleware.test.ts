import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
    getToken: jest.fn(),
}));

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
    prisma: {
        siteSettings: {
            findUnique: jest.fn(),
        },
        userAnalytics: {
            findUnique: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
    },
}));

// Mock NextResponse
jest.mock('next/server', () => {
    const originalModule = jest.requireActual('next/server');
    return {
        ...originalModule,
        NextResponse: {
            next: jest.fn().mockReturnValue({ type: 'next' }),
            rewrite: jest.fn().mockImplementation((url) => ({ type: 'rewrite', url })),
        },
    };
});

describe('Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should allow normal access when maintenance mode is off', async () => {
        // Mock settings with maintenance mode off
        (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
            id: 'settings',
            maintenanceMode: false,
        });

        // Mock no user token
        (getToken as jest.Mock).mockResolvedValue(null);

        // Create a mock request
        const request = new NextRequest('http://localhost:3000/dashboard');

        // Call the middleware
        const response = await middleware(request);

        // Assertions
        expect(response).toEqual({ type: 'next' });
        expect(NextResponse.rewrite).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should redirect to maintenance page when maintenance mode is on', async () => {
        // Mock settings with maintenance mode on
        (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
            id: 'settings',
            maintenanceMode: true,
        });

        // Mock no user token
        (getToken as jest.Mock).mockResolvedValue(null);

        // Create a mock request
        const request = new NextRequest('http://localhost:3000/dashboard');

        // Call the middleware
        const response = await middleware(request);

        // Assertions
        expect(response).toEqual({
            type: 'rewrite',
            url: new URL('/maintenance', 'http://localhost:3000/dashboard'),
        });
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
            new URL('/maintenance', 'http://localhost:3000/dashboard')
        );
        expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it('should allow admin access even when maintenance mode is on', async () => {
        // Mock settings with maintenance mode on
        (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
            id: 'settings',
            maintenanceMode: true,
        });

        // Mock admin user token
        (getToken as jest.Mock).mockResolvedValue({
            sub: 'admin123',
            role: 'ADMIN',
        });

        // Create a mock request
        const request = new NextRequest('http://localhost:3000/dashboard');

        // Mock headers
        Object.defineProperty(request, 'headers', {
            get: jest.fn().mockReturnValue(new Headers({
                'user-agent': 'Mozilla/5.0',
                'x-forwarded-for': '192.168.1.1',
            })),
        });

        // Call the middleware
        const response = await middleware(request);

        // Assertions
        expect(response).toEqual({ type: 'next' });
        expect(NextResponse.rewrite).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should update existing user analytics for authenticated users', async () => {
        // Mock settings with maintenance mode off
        (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
            id: 'settings',
            maintenanceMode: false,
        });

        // Mock authenticated user token
        (getToken as jest.Mock).mockResolvedValue({
            sub: 'user123',
            role: 'USER',
        });

        // Mock existing user analytics
        (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue({
            userId: 'user123',
            ipAddress: '192.168.1.1',
            device: 'Chrome',
            country: 'US',
            city: 'New York',
            lastVisit: new Date('2023-01-01'),
            visitCount: 5,
        });

        // Create a mock request
        const request = new NextRequest('http://localhost:3000/dashboard');

        // Mock headers
        Object.defineProperty(request, 'headers', {
            get: jest.fn().mockImplementation((name: string) => {
                const headers: Record<string, string> = {
                    'user-agent': 'Mozilla/5.0',
                    'x-forwarded-for': '192.168.1.2',
                };
                return headers[name] || null;
            }),
        });

        // Call the middleware
        const response = await middleware(request);

        // Assertions
        expect(response).toEqual({ type: 'next' });
        expect(prisma.userAnalytics.findUnique).toHaveBeenCalledWith({
            where: { userId: 'user123' },
        });
        expect(prisma.userAnalytics.update).toHaveBeenCalledWith({
            where: { userId: 'user123' },
            data: expect.objectContaining({
                ipAddress: '192.168.1.2',
                device: 'Mozilla/5.0',
                lastVisit: expect.any(Date),
            }),
        });
        expect(prisma.userAnalytics.create).not.toHaveBeenCalled();
    });

    it('should create new user analytics for first-time authenticated users', async () => {
        // Mock settings with maintenance mode off
        (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
            id: 'settings',
            maintenanceMode: false,
        });

        // Mock authenticated user token
        (getToken as jest.Mock).mockResolvedValue({
            sub: 'newuser123',
            role: 'USER',
        });

        // Mock no existing user analytics
        (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue(null);

        // Create a mock request
        const request = new NextRequest('http://localhost:3000/dashboard');

        // Mock headers
        Object.defineProperty(request, 'headers', {
            get: jest.fn().mockImplementation((name: string) => {
                const headers: Record<string, string> = {
                    'user-agent': 'Firefox/100.0',
                    'x-forwarded-for': '192.168.1.3',
                };
                return headers[name] || null;
            }),
        });

        // Call the middleware
        const response = await middleware(request);

        // Assertions
        expect(response).toEqual({ type: 'next' });
        expect(prisma.userAnalytics.findUnique).toHaveBeenCalledWith({
            where: { userId: 'newuser123' },
        });
        expect(prisma.userAnalytics.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'newuser123',
                ipAddress: '192.168.1.3',
                device: 'Firefox/100.0',
                country: 'Unknown',
                city: 'Unknown',
                lastVisit: expect.any(Date),
            }),
        });
        expect(prisma.userAnalytics.update).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        // Mock settings to throw an error
        (prisma.siteSettings.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

        // Mock no user token
        (getToken as jest.Mock).mockResolvedValue(null);

        // Create a mock request
        const request = new NextRequest('http://localhost:3000/dashboard');

        // Call the middleware
        const response = await middleware(request);

        // Assertions - should still proceed to next middleware/route
        expect(response).toEqual({ type: 'next' });
        expect(NextResponse.next).toHaveBeenCalled();
    });
}); 