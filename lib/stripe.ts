import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-02-24.acacia', // Use the latest API version
});

// Product price ID for the $20 lifetime access
// Use a fallback value for testing if the environment variable is not set
export const PRODUCT_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_placeholder';

// Constants for the product
export const PRODUCT = {
    name: 'Watermarker Pro',
    description: 'Lifetime access to Watermarker Pro',
    price: 19.99, // $20 USD
}; 