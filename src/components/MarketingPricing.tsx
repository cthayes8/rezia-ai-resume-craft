"use client";
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Free',
    priceLabel: 'Free',
    description: 'One free resume optimization',
    features: ['1 optimization', 'Basic keyword matching', 'ATS formatting', 'Download PDF'],
    isFree: true,
  },
  {
    name: 'Standard',
    priceLabel: '$29.99/mo',
    description: 'Unlimited resume optimizations',
    features: [
      'Unlimited optimizations',
      'ATS-friendly formatting',
      'Professional bullet rewrites',
      'PDF / DOCX download',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD!,
    popular: true,
  },
  {
    name: 'Premium',
    priceLabel: '$49.99/mo',
    description: 'All Standard features + AI cover letters & priority support',
    features: ['AI cover letters', 'Multiple resume versions', 'Priority support'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM!,
  },
];

export default function MarketingPricing() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  function handleClick(plan: typeof plans[0]) {
    if (!isLoaded) return;
    if (plan.isFree) {
      if (isSignedIn) {
        router.push('/dashboard/optimize');
      } else {
        router.push('/sign-up?redirect_url=/dashboard/optimize');
      }
    } else {
      const url = `/choose-plan?plan=${plan.priceId}`;
      if (isSignedIn) {
        router.push(url);
      } else {
        router.push(`/sign-up?redirect_url=${encodeURIComponent(url)}`);
      }
    }
  }

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Start free, upgrade anytime. Choose the plan that best fits your needs.
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
                  className="w-full bg-reslo-blue hover:bg-reslo-blue/90 text-white"
                >
                  {plan.isFree
                    ? isSignedIn
                      ? 'Go to Dashboard'
                      : 'Sign Up & Try Free'
                    : isSignedIn
                    ? 'Choose Plan'
                    : 'Sign Up & Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}