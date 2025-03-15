"use client";

/**
 * Client-side utility for checking if a user has paid
 * This uses the fetch API instead of directly accessing Prisma
 */

/**
 * Check if the current user has paid for the service (client version)
 * @returns {Promise<boolean>} True if the user has paid, false otherwise
 */
export async function hasUserPaidClient(): Promise<boolean> {
    try {
        const response = await fetch('/api/user/payment-status');

        if (!response.ok) {
            console.error(`Error checking payment status: ${response.status} ${response.statusText}`);
            return false;
        }

        const data = await response.json();
        return data.hasPaid === true;
    } catch (error) {
        console.error('Error checking payment status:', error);
        return false;
    }
} 