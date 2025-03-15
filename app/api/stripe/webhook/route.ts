import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// This is your Stripe webhook secret for testing your endpoint locally.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature') as string;

        let event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;

                // Find the payment record with this session ID
                const payment = await prisma.payment.findFirst({
                    where: { stripeSessionId: session.id },
                });

                if (payment) {
                    // Update the payment status to PAID
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'PAID',
                            // Fix: Handle line_items safely since it might not be available in the webhook payload
                            ...(session.line_items && {
                                stripePriceId: session.line_items?.data?.[0]?.price?.id
                            })
                        },
                    });
                } else {
                    console.error(`No payment record found for session ID: ${session.id}`);
                }
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Failed to process webhook' },
            { status: 500 }
        );
    }
} 