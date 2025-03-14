import React from 'react';
import { render, screen } from '@testing-library/react';
import { Navbar } from '@/components/navbar';
import { useSession } from 'next-auth/react';

// Mock the useSession hook
jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
}));

describe('Navbar Component', () => {
    it('renders the logo and site name', () => {
        // Mock unauthenticated session
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
        });

        render(<Navbar />);

        // Check if the site name is rendered
        expect(screen.getByText('Watermarker')).toBeInTheDocument();
    });

    it('shows sign in button when user is not authenticated', () => {
        // Mock unauthenticated session
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
        });

        render(<Navbar />);

        // Check if the sign in button is rendered
        expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('shows user menu when user is authenticated', () => {
        // Mock authenticated session
        (useSession as jest.Mock).mockReturnValue({
            data: {
                user: {
                    name: 'Test User',
                    email: 'test@example.com',
                    image: null,
                    role: 'USER',
                },
                expires: '2023-01-01',
            },
            status: 'authenticated',
        });

        render(<Navbar />);

        // The user's avatar should be rendered with their name
        expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('shows admin link when user is an admin', () => {
        // Mock authenticated session with admin role
        (useSession as jest.Mock).mockReturnValue({
            data: {
                user: {
                    name: 'Admin User',
                    email: 'admin@example.com',
                    image: null,
                    role: 'ADMIN',
                },
                expires: '2023-01-01',
            },
            status: 'authenticated',
        });

        render(<Navbar />);

        // Admin link should be visible
        expect(screen.getByText('Admin')).toBeInTheDocument();
    });
}); 