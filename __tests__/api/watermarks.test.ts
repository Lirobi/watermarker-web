import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/watermarks/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

// Mock next-auth
jest.mock('next-auth/next', () => ({
    getServerSession: jest.fn(),
}));

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
    prisma: {
        watermark: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
    },
}));

describe('Watermarks API Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET method', () => {
        it('should return 401 if user is not authenticated', async () => {
            // Mock session to return null (unauthenticated)
            (getServerSession as jest.Mock).mockResolvedValue(null);

            // Create a mock request
            const request = new NextRequest('http://localhost:3000/api/watermarks');

            // Call the API route
            const response = await GET(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(401);
            expect(responseData).toEqual({ error: 'Unauthorized' });
            expect(prisma.watermark.findMany).not.toHaveBeenCalled();
        });

        it('should return watermarks for authenticated user', async () => {
            // Mock authenticated session
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'user123', email: 'test@example.com' }
            });

            // Create a mock request
            const request = new NextRequest('http://localhost:3000/api/watermarks');

            // Mock watermarks data
            const mockWatermarks = [
                { id: 'wm1', name: 'Logo', userId: 'user123', type: 'IMAGE' },
                { id: 'wm2', name: 'Copyright', userId: 'user123', type: 'TEXT' }
            ];
            (prisma.watermark.findMany as jest.Mock).mockResolvedValue(mockWatermarks);

            // Call the API route
            const response = await GET(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(responseData).toEqual(mockWatermarks);
            expect(prisma.watermark.findMany).toHaveBeenCalledWith({
                where: { userId: 'user123' }
            });
        });

        it('should handle server errors', async () => {
            // Mock authenticated session
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'user123', email: 'test@example.com' }
            });

            // Create a mock request
            const request = new NextRequest('http://localhost:3000/api/watermarks');

            // Mock Prisma to throw an error
            (prisma.watermark.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

            // Call the API route
            const response = await GET(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(500);
            expect(responseData).toEqual({ error: 'Failed to fetch watermarks' });
        });
    });

    describe('POST method', () => {
        it('should return 401 if user is not authenticated', async () => {
            // Mock session to return null (unauthenticated)
            (getServerSession as jest.Mock).mockResolvedValue(null);

            // Mock request
            const request = {
                json: jest.fn().mockResolvedValue({
                    name: 'New Watermark',
                    type: 'TEXT',
                    content: 'Copyright 2023',
                    position: { x: 10, y: 10 },
                    style: { opacity: 0.7, fontSize: 16 }
                })
            } as unknown as NextRequest;

            // Call the API route
            const response = await POST(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(401);
            expect(responseData).toEqual({ error: 'Unauthorized' });
            expect(prisma.watermark.create).not.toHaveBeenCalled();
        });

        it('should return 400 if required fields are missing', async () => {
            // Mock authenticated session
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'user123', email: 'test@example.com' }
            });

            // Mock request with missing fields
            const request = {
                json: jest.fn().mockResolvedValue({
                    name: 'New Watermark',
                    // Missing type and content
                })
            } as unknown as NextRequest;

            // Call the API route
            const response = await POST(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(400);
            expect(responseData).toEqual({ error: 'Name, type, and content are required' });
            expect(prisma.watermark.create).not.toHaveBeenCalled();
        });

        it('should create a new watermark successfully', async () => {
            // Mock authenticated session
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'user123', email: 'test@example.com' }
            });

            // Mock request data
            const watermarkData = {
                name: 'New Watermark',
                type: 'TEXT',
                content: 'Copyright 2023',
                position: { x: 10, y: 10 },
                style: { opacity: 0.7, fontSize: 16 }
            };

            const request = {
                json: jest.fn().mockResolvedValue(watermarkData)
            } as unknown as NextRequest;

            // Mock Prisma create response
            const createdWatermark = {
                id: 'wm123',
                userId: 'user123',
                ...watermarkData
            };
            (prisma.watermark.create as jest.Mock).mockResolvedValue(createdWatermark);

            // Call the API route
            const response = await POST(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(201);
            expect(responseData).toEqual(createdWatermark);
            expect(prisma.watermark.create).toHaveBeenCalledWith({
                data: {
                    ...watermarkData,
                    userId: 'user123'
                }
            });
        });

        it('should handle server errors during creation', async () => {
            // Mock authenticated session
            (getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'user123', email: 'test@example.com' }
            });

            // Mock request data
            const watermarkData = {
                name: 'New Watermark',
                type: 'TEXT',
                content: 'Copyright 2023',
                position: { x: 10, y: 10 },
                style: { opacity: 0.7, fontSize: 16 }
            };

            const request = {
                json: jest.fn().mockResolvedValue(watermarkData)
            } as unknown as NextRequest;

            // Mock Prisma to throw an error
            (prisma.watermark.create as jest.Mock).mockRejectedValue(new Error('Database error'));

            // Call the API route
            const response = await POST(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(500);
            expect(responseData).toEqual({ error: 'Failed to create watermark' });
        });
    });
}); 