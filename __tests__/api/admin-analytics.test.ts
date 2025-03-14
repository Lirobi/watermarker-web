import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/analytics/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

// Mock next-auth
jest.mock('next-auth/next', () => ({
    getServerSession: jest.fn(),
}));

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findMany: jest.fn(),
        },
    },
}));

describe('Admin Analytics API Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if user is not authenticated', async () => {
        // Mock session to return null (unauthenticated)
        (getServerSession as jest.Mock).mockResolvedValue(null);

        // Create a mock request
        const request = new NextRequest('http://localhost:3000/api/admin/analytics');

        // Call the API route
        const response = await GET(request);
        const responseData = await response.json();

        // Assertions
        expect(response.status).toBe(401);
        expect(responseData).toEqual({ error: 'Unauthorized' });
        expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not an admin', async () => {
        // Mock authenticated session but not admin
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: 'user123', email: 'test@example.com', role: 'USER' }
        });

        // Create a mock request
        const request = new NextRequest('http://localhost:3000/api/admin/analytics');

        // Call the API route
        const response = await GET(request);
        const responseData = await response.json();

        // Assertions
        expect(response.status).toBe(401);
        expect(responseData).toEqual({ error: 'Unauthorized' });
        expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should return user analytics for admin user', async () => {
        // Mock authenticated admin session
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: 'admin123', email: 'admin@example.com', role: 'ADMIN' }
        });

        // Create a mock request
        const request = new NextRequest('http://localhost:3000/api/admin/analytics');

        // Mock users data with analytics
        const mockUsers = [
            {
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                image: null,
                role: 'USER',
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02'),
                storageUsed: 1024,
                userAnalytics: {
                    ipAddress: '192.168.1.1',
                    device: 'Chrome on Windows',
                    country: 'US',
                    city: 'New York',
                    lastVisit: new Date('2023-01-02'),
                    visitCount: 5,
                }
            },
            {
                id: 'user2',
                name: 'User Two',
                email: 'user2@example.com',
                image: null,
                role: 'USER',
                createdAt: new Date('2023-01-03'),
                updatedAt: new Date('2023-01-04'),
                storageUsed: 2048,
                userAnalytics: null
            }
        ];

        (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

        // Call the API route
        const response = await GET(request);
        const responseData = await response.json();

        // Expected formatted response
        const expectedResponse = [
            {
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                image: null,
                role: 'USER',
                createdAt: mockUsers[0].createdAt,
                updatedAt: mockUsers[0].updatedAt,
                storageUsed: 1024,
                analytics: {
                    ipAddress: '192.168.1.1',
                    device: 'Chrome on Windows',
                    country: 'US',
                    city: 'New York',
                    lastVisit: mockUsers[0].userAnalytics?.lastVisit,
                    visitCount: 5,
                }
            },
            {
                id: 'user2',
                name: 'User Two',
                email: 'user2@example.com',
                image: null,
                role: 'USER',
                createdAt: mockUsers[1].createdAt,
                updatedAt: mockUsers[1].updatedAt,
                storageUsed: 2048,
                analytics: null
            }
        ];

        // Assertions
        expect(response.status).toBe(200);
        expect(responseData).toEqual(expectedResponse);
        expect(prisma.user.findMany).toHaveBeenCalledWith({
            include: {
                userAnalytics: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    });

    it('should handle server errors', async () => {
        // Mock authenticated admin session
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: 'admin123', email: 'admin@example.com', role: 'ADMIN' }
        });

        // Create a mock request
        const request = new NextRequest('http://localhost:3000/api/admin/analytics');

        // Mock Prisma to throw an error
        (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

        // Call the API route
        const response = await GET(request);
        const responseData = await response.json();

        // Assertions
        expect(response.status).toBe(500);
        expect(responseData).toEqual({ error: 'Failed to fetch user analytics' });
    });
}); 