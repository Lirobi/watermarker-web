import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MaintenancePage from '@/app/maintenance/page';
import { useRouter } from 'next/navigation';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Mock the HeroUI Button component to avoid Ripple issues
jest.mock('@heroui/button', () => ({
    Button: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
        <button onClick={onClick} data-testid="mock-button">{children}</button>
    ),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div data-testid="motion-div" {...props}>{children}</div>,
    },
}));

describe('MaintenancePage Component', () => {
    const mockRefresh = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({
            refresh: mockRefresh,
        });
    });

    it('renders the maintenance page correctly', () => {
        render(<MaintenancePage />);

        // Check if the title is rendered
        expect(screen.getByText('Site Maintenance')).toBeInTheDocument();

        // Check if the description is rendered
        expect(screen.getByText("We're currently performing scheduled maintenance.")).toBeInTheDocument();

        // Check if the message is rendered
        expect(screen.getByText(/Our team is working hard to improve your experience/i)).toBeInTheDocument();

        // Check if the Try Again button is rendered
        expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('calls router.refresh when Try Again button is clicked', () => {
        render(<MaintenancePage />);

        // Find and click the Try Again button (using our mocked button)
        const tryAgainButton = screen.getByTestId('mock-button');
        tryAgainButton.click();

        // Check if router.refresh was called
        expect(mockRefresh).toHaveBeenCalled();
    });

    it('renders the maintenance icon', () => {
        const { container } = render(<MaintenancePage />);

        // Find the SVG path with the lightning bolt path data
        const svgPath = container.querySelector('path[d="M13 10V3L4 14h7v7l9-11h-7z"]');

        // Check if the SVG path exists
        expect(svgPath).not.toBeNull();
    });

    it('uses motion components for animations', () => {
        render(<MaintenancePage />);

        // Check if motion components are used
        const motionElements = screen.getAllByTestId('motion-div');
        expect(motionElements.length).toBeGreaterThan(0);
    });
}); 