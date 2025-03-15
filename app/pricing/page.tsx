import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { hasUserPaid } from "@/lib/payment";
import { PRODUCT } from "@/lib/stripe";
import PricingPageClient from "@/components/PricingPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Watermarker Pro",
  description: "Get lifetime access to our premium watermarking tool",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
  params?: any;
}) {
  const session = await getServerSession();
  const hasPaid = await hasUserPaid();
  const accessDenied = searchParams?.access === "denied";
  const paymentCanceled = searchParams?.canceled === "true";
  const paymentSuccess = searchParams?.success === "true";

  // If payment was successful, redirect to watermarker
  if (paymentSuccess && hasPaid) {
    redirect("/watermarker");
  }

  return (
    <PricingPageClient
      session={session}
      hasPaid={hasPaid}
      accessDenied={accessDenied}
      paymentCanceled={paymentCanceled}
      paymentSuccess={paymentSuccess}
      product={PRODUCT}
    />
  );
}
