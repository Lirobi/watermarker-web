import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/admin/settings/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

// Mock next-auth
jest.mock('next-auth/next', () => ({
    getServerSession: jest.fn(),
}));

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
    prisma: {
        siteSettings: {
            findFirst: jest.fn(),
            upsert: jest.fn(),
        },
    },
}));

describe('Admin Settings API Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET method', () => {
        it('should return 401 if user is not authenticated', async () => {
            // Mock session to return null (unauthenticated)
            (getServerSession as jest.Mock).mockResolvedValue(null);

            // Create a mock request
            const request = new NextRequest('http://localhost:3000/api/admin/settings');

            // Call the API route
            const response = await GET(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(401);
            expect(responseData).toEqual({ error: 'Unauthorized' });
            expect(prisma.siteSettings.findFirst).not.toHaveBeenCalled();
        });

        it('should return 401 if user is not an admin', async () => {
            // Mock authenticated session but not admin
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'user123', email: 'test@example.com', role: 'USER' }
            });

            // Create a mock request
            const request = new NextRequest('http://localhost:3000/api/admin/settings');

            // Call the API route
            const response = await GET(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(401);
            expect(responseData).toEqual({ error: 'Unauthorized' });
            expect(prisma.siteSettings.findFirst).not.toHaveBeenCalled();
        });

        it('should return existing settings for admin user', async () => {
            // Mock authenticated admin session
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'admin123', email: 'admin@example.com', role: 'ADMIN' }
            });

            // Create a mock request
            const request = new NextRequest('http://localhost:3000/api/admin/settings');

            // Mock settings data
            const mockSettings = {
                id: 'settings1',
                maintenanceMode: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (prisma.siteSettings.findFirst as jest.Mock).mockResolvedValue(mockSettings);

            // Call the API route
            const response = await GET(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(responseData).toEqual(mockSettings);
            expect(prisma.siteSettings.findFirst).toHaveBeenCalled();
        });

        it('should create default settings if none exist', async () => {
            // Mock authenticated admin session
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'admin123', email: 'admin@example.com', role: 'ADMIN' }
            });

            // Create a mock request
            const request = new NextRequest('http://localhost:3000/api/admin/settings');

            // Mock settings data - first call returns null, second call returns created settings
            const mockSettings = {
                id: 'settings1',
                maintenanceMode: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (prisma.siteSettings.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.siteSettings.upsert as jest.Mock).mockResolvedValue(mockSettings);

            // Call the API route
            const response = await GET(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(responseData).toEqual(mockSettings);
            expect(prisma.siteSettings.findFirst).toHaveBeenCalled();
            expect(prisma.siteSettings.upsert).toHaveBeenCalledWith({
                where: { id: '1' },
                update: {},
                create: { id: '1', maintenanceMode: false }
            });
        });

        it('should handle server errors', async () => {
            // Mock authenticated admin session
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'admin123', email: 'admin@example.com', role: 'ADMIN' }
            });

            // Create a mock request
            const request = new NextRequest('http://localhost:3000/api/admin/settings');

            // Mock Prisma to throw an error
            (prisma.siteSettings.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

            // Call the API route
            const response = await GET(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(500);
            expect(responseData).toEqual({ error: 'Failed to fetch site settings' });
        });
    });

    describe('PATCH method', () => {
        it('should return 401 if user is not authenticated', async () => {
            // Mock session to return null (unauthenticated)
            (getServerSession as jest.Mock).mockResolvedValue(null);

            // Mock request
            const request = {
                json: jest.fn().mockResolvedValue({
                    maintenanceMode: true
                })
            } as unknown as NextRequest;

            // Call the API route
            const response = await PATCH(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(401);
            expect(responseData).toEqual({ error: 'Unauthorized' });
            expect(prisma.siteSettings.upsert).not.toHaveBeenCalled();
        });

        it('should return 401 if user is not an admin', async () => {
            // Mock authenticated session but not admin
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'user123', email: 'test@example.com', role: 'USER' }
            });

            // Mock request
            const request = {
                json: jest.fn().mockResolvedValue({
                    maintenanceMode: true
                })
            } as unknown as NextRequest;

            // Call the API route
            const response = await PATCH(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(401);
            expect(responseData).toEqual({ error: 'Unauthorized' });
            expect(prisma.siteSettings.upsert).not.toHaveBeenCalled();
        });

        it('should update settings successfully for admin user', async () => {
            // Mock authenticated admin session
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'admin123', email: 'admin@example.com', role: 'ADMIN' }
            });

            // Mock request data
            const settingsData = {
                maintenanceMode: true
            };

            const request = {
                json: jest.fn().mockResolvedValue(settingsData)
            } as unknown as NextRequest;

            // Mock Prisma upsert response
            const updatedSettings = {
                id: '1',
                maintenanceMode: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (prisma.siteSettings.upsert as jest.Mock).mockResolvedValue(updatedSettings);

            // Call the API route
            const response = await PATCH(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(responseData).toEqual(updatedSettings);
            expect(prisma.siteSettings.upsert).toHaveBeenCalledWith({
                where: { id: '1' },
                update: settingsData,
                create: { id: '1', ...settingsData }
            });
        });

        it('should handle server errors during update', async () => {
            // Mock authenticated admin session
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'admin123', email: 'admin@example.com', role: 'ADMIN' }
            });

            // Mock request data
            const settingsData = {
                maintenanceMode: true
            };

            const request = {
                json: jest.fn().mockResolvedValue(settingsData)
            } as unknown as NextRequest;

            // Mock Prisma to throw an error
            (prisma.siteSettings.upsert as jest.Mock).mockRejectedValue(new Error('Database error'));

            // Call the API route
            const response = await PATCH(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(500);
            expect(responseData).toEqual({ error: 'Failed to update site settings' });
        });
    });
}); 