import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { stripe, PRODUCT_PRICE_ID, PRODUCT } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        // Get the authenticated user
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'You must be logged in to make a purchase' },
                { status: 401 }
            );
        }

        // Find the user in the database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { payment: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if the user has already paid
        if (user.payment?.status === 'PAID') {
            return NextResponse.json(
                { error: 'You have already purchased this product' },
                { status: 400 }
            );
        }

        // Create or retrieve a Stripe customer
        let stripeCustomerId = user.payment?.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email || undefined,
                name: user.name || undefined,
            });
            stripeCustomerId = customer.id;

            // Create or update payment record
            await prisma.payment.upsert({
                where: { userId: user.id },
                update: { stripeCustomerId },
                create: {
                    userId: user.id,
                    stripeCustomerId,
                },
            });
        }

        // Verify that we have a valid price ID or create one if needed
        let priceId = PRODUCT_PRICE_ID;

        if (!priceId || priceId === 'price_placeholder') {
            // Create a product and price in Stripe for testing
            const product = await stripe.products.create({
                name: PRODUCT.name,
                description: PRODUCT.description,
            });

            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: PRODUCT.price * 100, // Convert to cents
                currency: 'usd',
            });

            priceId = price.id;
        }

        // Create a checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
        });

        // Update the payment record with the session ID
        await prisma.payment.update({
            where: { userId: user.id },
            data: {
                stripeSessionId: checkoutSession.id,
                stripePriceId: priceId,
            },
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
} 