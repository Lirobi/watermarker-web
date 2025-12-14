import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SignInPage from '@/app/auth/signin/page';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock the modules
jest.mock('next-auth/react', () => ({
    signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        const { alt = '', ...rest } = props;
        return <img alt={alt} {...rest} />;
    },
}));

describe('SignInPage Component', () => {
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup default mocks
        (useRouter as jest.Mock).mockReturnValue({
            push: jest.fn(),
        });

        (useSearchParams as jest.Mock).mockReturnValue({
            get: jest.fn().mockReturnValue(null),
        });
    });

    it('renders the sign in form', () => {
        render(<SignInPage />);

        // Check if the title is rendered
        expect(screen.getByText('Sign In')).toBeInTheDocument();

        // Check if form elements are rendered
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    });

    it('shows success message when registered param is true', () => {
        (useSearchParams as jest.Mock).mockReturnValue({
            get: jest.fn().mockImplementation((param) => {
                if (param === 'registered') return 'true';
                return null;
            }),
        });

        render(<SignInPage />);

        // Check if success message is displayed
        expect(screen.getByText('Account created successfully! Please sign in.')).toBeInTheDocument();
    });

    it('handles email sign in', async () => {
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });

        (signIn as jest.Mock).mockResolvedValue({ error: null });

        render(<SignInPage />);

        // Fill in the form
        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'test@example.com' },
        });

        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password123' },
        });

        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

        // Check if signIn was called with correct params
        expect(signIn).toHaveBeenCalledWith('credentials', {
            email: 'test@example.com',
            password: 'password123',
            redirect: false,
        });
    });

    it('shows error message when sign in fails', async () => {
        (signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' });

        render(<SignInPage />);

        // Fill in the form
        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'test@example.com' },
        });

        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'wrongpassword' },
        });

        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

        // Wait for the error message to appear
        expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    });

    it('handles Google sign in', () => {
        render(<SignInPage />);

        // Click the Google sign in button
        fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));

        // Check if signIn was called with correct params
        expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
    });
}); 