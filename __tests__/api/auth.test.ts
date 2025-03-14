import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        userAnalytics: {
            findUnique: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
    },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}));

// Create mock functions that simulate the NextAuth callbacks
const mockAuthorize = async (credentials: any) => {
    if (!credentials?.email || !credentials?.password) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { email: credentials.email }
    });

    if (!user || !user.password) {
        return null;
    }

    const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
    );

    if (!isPasswordValid) {
        return null;
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role
    };
};

const mockSessionCallback = async ({ session, token, user }: any) => {
    if (session.user) {
        if (token) {
            session.user.id = token.sub;
            session.user.role = token.role;
        } else if (user) {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
            });

            session.user.id = user.id;
            session.user.role = dbUser?.role || "USER";

            if (dbUser?.email === "lilian.bischung@gmail.com" && dbUser.role !== "ADMIN") {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: "ADMIN" },
                });
                session.user.role = "ADMIN";
            }
        }
    }
    return session;
};

const mockJwtCallback = async ({ token, user }: any) => {
    if (user) {
        token.role = user.role;
    }
    return token;
};

const mockSignInCallback = async ({ user }: any) => {
    if (user.id) {
        const userAnalytics = await prisma.userAnalytics.findUnique({
            where: { userId: user.id },
        });

        if (userAnalytics) {
            await prisma.userAnalytics.update({
                where: { userId: user.id },
                data: {
                    lastVisit: new Date(),
                    visitCount: userAnalytics.visitCount + 1,
                },
            });
        } else {
            await prisma.userAnalytics.create({
                data: {
                    userId: user.id,
                    lastVisit: new Date(),
                },
            });
        }
    }
    return true;
};

describe('NextAuth Configuration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Credentials Provider', () => {
        it('should return null if credentials are missing', async () => {
            const result = await mockAuthorize({});

            expect(result).toBeNull();
            expect(prisma.user.findUnique).not.toHaveBeenCalled();
        });

        it('should return null if user is not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await mockAuthorize({
                email: 'nonexistent@example.com',
                password: 'password123',
            });

            expect(result).toBeNull();
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'nonexistent@example.com' },
            });
        });

        it('should return null if password is invalid', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashed_password',
                role: 'USER',
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await mockAuthorize({
                email: 'test@example.com',
                password: 'wrong_password',
            });

            expect(result).toBeNull();
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
            expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
        });

        it('should return user data if credentials are valid', async () => {
            const mockUser = {
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashed_password',
                image: null,
                role: 'USER',
            };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await mockAuthorize({
                email: 'test@example.com',
                password: 'correct_password',
            });

            expect(result).toEqual({
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                image: null,
                role: 'USER',
            });
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
            expect(bcrypt.compare).toHaveBeenCalledWith('correct_password', 'hashed_password');
        });
    });

    describe('Session Callback', () => {
        it('should add user role to session from token', async () => {
            const session = {
                user: {
                    name: 'Test User',
                    email: 'test@example.com',
                },
                expires: '2023-01-01',
            };
            const token = {
                sub: 'user123',
                role: 'USER',
            };

            const result = await mockSessionCallback({ session, token, user: undefined });

            expect(result.user).toEqual({
                name: 'Test User',
                email: 'test@example.com',
                id: 'user123',
                role: 'USER',
            });
        });

        it('should add user role to session from database', async () => {
            const session = {
                user: {
                    name: 'Test User',
                    email: 'test@example.com',
                },
                expires: '2023-01-01',
            };
            const user = {
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
            };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'USER',
            });

            const result = await mockSessionCallback({ session, user, token: undefined });

            expect(result.user).toEqual({
                name: 'Test User',
                email: 'test@example.com',
                id: 'user123',
                role: 'USER',
            });
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user123' },
            });
        });

        it('should promote specific user to admin', async () => {
            const session = {
                user: {
                    name: 'Admin User',
                    email: 'lilian.bischung@gmail.com',
                },
                expires: '2023-01-01',
            };
            const user = {
                id: 'admin123',
                name: 'Admin User',
                email: 'lilian.bischung@gmail.com',
            };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'admin123',
                name: 'Admin User',
                email: 'lilian.bischung@gmail.com',
                role: 'USER', // Not yet admin
            });

            const result = await mockSessionCallback({ session, user, token: undefined });

            expect(result.user).toEqual({
                name: 'Admin User',
                email: 'lilian.bischung@gmail.com',
                id: 'admin123',
                role: 'ADMIN',
            });
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'admin123' },
            });
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'admin123' },
                data: { role: 'ADMIN' },
            });
        });
    });

    describe('JWT Callback', () => {
        it('should add user role to token', async () => {
            const token = {
                sub: 'user123',
            };
            const user = {
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'USER',
            };

            const result = await mockJwtCallback({ token, user });

            expect(result).toEqual({
                sub: 'user123',
                role: 'USER',
            });
        });
    });

    describe('SignIn Callback', () => {
        it('should update user analytics on sign in for existing user', async () => {
            const user = {
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
            };
            (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue({
                userId: 'user123',
                visitCount: 5,
            });

            const result = await mockSignInCallback({ user });

            expect(result).toBe(true);
            expect(prisma.userAnalytics.findUnique).toHaveBeenCalledWith({
                where: { userId: 'user123' },
            });
            expect(prisma.userAnalytics.update).toHaveBeenCalledWith({
                where: { userId: 'user123' },
                data: {
                    lastVisit: expect.any(Date),
                    visitCount: 6,
                },
            });
        });

        it('should create user analytics on first sign in', async () => {
            const user = {
                id: 'newuser123',
                name: 'New User',
                email: 'newuser@example.com',
            };
            (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await mockSignInCallback({ user });

            expect(result).toBe(true);
            expect(prisma.userAnalytics.findUnique).toHaveBeenCalledWith({
                where: { userId: 'newuser123' },
            });
            expect(prisma.userAnalytics.create).toHaveBeenCalledWith({
                data: {
                    userId: 'newuser123',
                    lastVisit: expect.any(Date),
                },
            });
        });
    });
}); 