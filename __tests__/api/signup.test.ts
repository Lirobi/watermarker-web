import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/signup/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('Signup API Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new user successfully', async () => {
        // Mock the request
        const request = {
            json: jest.fn().mockResolvedValue({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            }),
        } as unknown as NextRequest;

        // Mock Prisma responses
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.user.create as jest.Mock).mockResolvedValue({
            id: 'user_id',
            name: 'Test User',
            email: 'test@example.com',
            password: 'hashed_password',
        });

        // Call the API route
        const response = await POST(request);
        const responseData = await response.json();

        // Assertions
        expect(response.status).toBe(201);
        expect(responseData).toEqual({
            message: 'User created successfully',
            user: {
                id: 'user_id',
                name: 'Test User',
                email: 'test@example.com',
            },
        });

        // Check if bcrypt.hash was called
        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);

        // Check if Prisma methods were called correctly
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: 'test@example.com' },
        });
        expect(prisma.user.create).toHaveBeenCalledWith({
            data: {
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashed_password',
            },
        });
    });

    it('should return 400 if required fields are missing', async () => {
        // Mock the request with missing fields
        const request = {
            json: jest.fn().mockResolvedValue({
                name: 'Test User',
                // Missing email and password
            }),
        } as unknown as NextRequest;

        // Call the API route
        const response = await POST(request);
        const responseData = await response.json();

        // Assertions
        expect(response.status).toBe(400);
        expect(responseData).toEqual({
            error: 'Name, email, and password are required',
        });

        // Prisma methods should not be called
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
        expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should return 409 if user already exists', async () => {
        // Mock the request
        const request = {
            json: jest.fn().mockResolvedValue({
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123',
            }),
        } as unknown as NextRequest;

        // Mock Prisma response for existing user
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'existing_user_id',
            email: 'existing@example.com',
        });

        // Call the API route
        const response = await POST(request);
        const responseData = await response.json();

        // Assertions
        expect(response.status).toBe(409);
        expect(responseData).toEqual({
            error: 'User with this email already exists',
        });

        // Check if Prisma methods were called correctly
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: 'existing@example.com' },
        });
        expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle server errors', async () => {
        // Mock the request
        const request = {
            json: jest.fn().mockResolvedValue({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            }),
        } as unknown as NextRequest;

        // Mock Prisma to throw an error
        (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

        // Call the API route
        const response = await POST(request);
        const responseData = await response.json();

        // Assertions
        expect(response.status).toBe(500);
        expect(responseData).toEqual({
            error: 'Failed to create user',
        });
    });
}); 