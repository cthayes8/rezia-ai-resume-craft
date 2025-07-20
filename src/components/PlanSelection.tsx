"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Plans for selection (paid tiers only)
const plans = [
  {
    name: "Free",
    priceLabel: "Free",
    description: "One free resume optimization",
    features: [
      "1 optimization",
      "Basic keyword matching",
      "ATS formatting",
      "Download PDF",
    ],
    isFree: true,
  },
  {
    name: "Standard",
    priceLabel: "$29.99/mo",
    description: "Unlimited resume optimizations",
    features: [
      "Unlimited optimizations",
      "Job-specific matching",
      "ATS-friendly formatting",
      "PDF / DOCX download",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD!,
    popular: true,
  },
  {
    name: "Premium",
    priceLabel: "$49.99/mo",
    description: "All Standard features + AI cover letters & priority support",
    features: [
      "AI cover letter generation",
      "Multiple resume versions",
      "Priority support",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM!,
  },
];

export default function PlanSelection() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleClick = async (plan: typeof plans[0]) => {
    if (!isLoaded) return;
    if (plan.isFree) {
      if (isSignedIn) {
        router.push('/dashboard/unified');
      } else {
        router.push('/sign-up?redirect_url=/dashboard/unified');
      }
      return;
    }
    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=/choose-plan?plan=${plan.stripePriceId}`);
      return;
    }
    try {
      setLoading(plan.name);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.stripePriceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: 'Checkout Error', description: err.message, variant: 'destructive' });
      setLoading(null);
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Select Your Plan</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan to accelerate your job search with AI-powered resume optimization
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className="relative border-2 hover:border-reslo-blue/50 transition-all duration-200 hover:shadow-lg"
            >
              {plan.popular && (
                <Badge className="absolute -top-3 right-4 bg-reslo-blue text-white border-0">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="space-y-4">
                <h3 className="text-2xl font-bold text-reslo-blue">{plan.name}</h3>
                <div>
                  <p className="text-3xl font-bold">{plan.priceLabel}</p>
                  <p className="mt-1 text-gray-600">{plan.description}</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start">
                      <span className="mr-2 text-reslo-blue">✓</span>
                      <span className="text-gray-700">{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleClick(plan)}
                  disabled={!!loading}
                  className="w-full bg-reslo-blue hover:bg-reslo-blue/90 text-white"
                >
                  {plan.isFree
                    ? isSignedIn
                      ? 'Go to Dashboard'
                      : 'Sign Up & Try Free'
                    : loading === plan.name
                    ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⟳</span>
                        Redirecting...
                      </span>
                    )
                    : 'Get Started'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}