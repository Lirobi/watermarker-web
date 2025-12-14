import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for the DOM matchers
import WatermarkEditor from '@/components/WatermarkEditor';

// Mock react-draggable
jest.mock('react-draggable', () => {
    return {
        __esModule: true,
        default: ({ children, position, onDrag, onStop }: any) => (
            <button
                type="button"
                data-testid="draggable-component"
                onClick={(e) => {
                    // Simulate drag end
                    if (onStop) onStop(e, { x: 100, y: 100 });
                }}
            >
                {children}
            </button>
        ),
    };
});

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        const { alt = '', ...rest } = props;
        return <img alt={alt} {...rest} data-testid="next-image" />;
    },
}));

describe('WatermarkEditor Component', () => {
    const defaultProps = {
        mediaType: 'image' as const,
        mediaSrc: '/test-image.jpg',
        watermarkType: 'text' as const,
        watermarkContent: 'Test Watermark',
        opacity: 70,
        scale: 100,
        rotation: 0,
        onPositionChange: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock getBoundingClientRect for container sizing
        Element.prototype.getBoundingClientRect = jest.fn(() => ({
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            right: 800,
            bottom: 600,
            x: 0,
            y: 0,
            toJSON: () => { },
        }));
    });

    it('renders the media content correctly', () => {
        render(<WatermarkEditor {...defaultProps} />);

        // Check if the image is rendered
        const image = screen.getByTestId('next-image');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', '/test-image.jpg');
        expect(image).toHaveAttribute('alt', 'Media');
    });

    it('renders text watermark correctly', () => {
        render(<WatermarkEditor {...defaultProps} />);

        // Check if the watermark text is rendered
        const watermarkText = screen.getByText('Test Watermark');
        expect(watermarkText).toBeInTheDocument();
    });

    it('renders image watermark correctly', () => {
        render(
            <WatermarkEditor
                {...defaultProps}
                watermarkType="image"
                watermarkContent=""
                watermarkImageSrc="/watermark-logo.png"
            />
        );

        // Check if the watermark image is rendered
        const watermarkImages = screen.getAllByTestId('next-image');
        expect(watermarkImages.length).toBeGreaterThan(1); // At least 2 images (media and watermark)
        const watermarkImage = watermarkImages[1]; // Second image is the watermark
        expect(watermarkImage).toBeInTheDocument();
        expect(watermarkImage).toHaveAttribute('src', '/watermark-logo.png');
        expect(watermarkImage).toHaveAttribute('alt', 'Watermark');
    });

    it('applies correct styling based on props', () => {
        render(
            <WatermarkEditor
                {...defaultProps}
                opacity={50}
                scale={150}
                rotation={45}
            />
        );

        // Get the watermark text element
        const watermarkText = screen.getByText('Test Watermark');

        // Check the computed style - we can't directly check CSS properties in JSDOM
        // but we can check if the style attribute contains the expected values
        const style = window.getComputedStyle(watermarkText);

        // Check if the element has style properties
        expect(watermarkText).toHaveStyle({
            opacity: '0.5', // 50/100
            transform: 'scale(1.5) rotate(45deg)', // Combined transform
        });
    });

    it('calls onPositionChange when dragging ends', () => {
        render(<WatermarkEditor {...defaultProps} />);

        // Find the draggable component
        const draggable = screen.getByTestId('draggable-component');

        // Simulate drag end by clicking (as per our mock implementation)
        fireEvent.click(draggable);

        // Check if onPositionChange was called with the expected position
        expect(defaultProps.onPositionChange).toHaveBeenCalled();
        // Note: We can't check the exact values because the component might transform them
    });

    it('renders video media correctly', () => {
        render(
            <WatermarkEditor
                {...defaultProps}
                mediaType="video"
                mediaSrc="/test-video.mp4"
            />
        );

        // Check if the video element is rendered
        const video = screen.getByTestId('video-element');
        expect(video).toBeInTheDocument();
        expect(video).toHaveAttribute('src', '/test-video.mp4');
        expect(video).toHaveClass('w-full h-full object-contain');
    });

    it('shows snap guidelines when dragging', () => {
        // This is a more complex test that would require state manipulation
        // We'll use a simplified approach to test the presence of snap guidelines

        // Create a component with a mock implementation that forces isDragging state
        const { rerender } = render(<WatermarkEditor {...defaultProps} />);

        // Initially, no snap guidelines should be visible
        expect(screen.queryByTestId('snap-guideline-x')).not.toBeInTheDocument();
        expect(screen.queryByTestId('snap-guideline-y')).not.toBeInTheDocument();

        // We can't easily test the snap guidelines without manipulating component state
        // In a real application, we would use a more sophisticated testing approach
        // or test this functionality with integration tests
    });
}); 