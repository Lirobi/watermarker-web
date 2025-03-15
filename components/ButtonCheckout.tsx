'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';

export default function ButtonCheckout() {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async () => {
        try {
            setIsLoading(true);

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok && data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
            } else {
                console.error('Checkout error:', data.error);
                alert(`Payment error: ${data.error || 'Something went wrong'}`);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Payment failed. Please try again later.');
            setIsLoading(false);
        }
    };

    return (
        <Button
            color="default"
            onClick={handleCheckout}
            disabled={isLoading}
            size="lg"
            className="bg-white font-medium text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg"
            fullWidth={false}
        >
            {isLoading ? (
                <>
                    <Spinner size="sm" color="current" />
                    <span className="ml-2">Processing...</span>
                </>
            ) : (
                'Get Started Now'
            )}
        </Button>
    );
} 