"use client";
import { useEffect } from "react";
import { PricingTable } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";

const Pricing = () => {
  useEffect(() => {
    // Wait for Clerk PricingTable to render premium badge
    const interval = setInterval(() => {
      const premiumCard = document.querySelector('.cl-pricingTableCard__Reslo_premium');
      if (premiumCard && !premiumCard.querySelector('.Reslo-premium-badge')) {
        const badge = document.createElement('div');
        badge.className = 'Reslo-premium-badge';
        badge.innerText = '🔥 Most Popular';
        premiumCard.prepend(badge);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);
  

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="inline-block rounded-full bg-reslo-blue/10 text-reslo-blue font-semibold uppercase text-xs px-4 py-1 mb-4">Pricing</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 text-lg">
            Start free. Upgrade when you're ready to optimize every resume and cover letter.
          </p>
        </div>
        <div
          className="relative w-full"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Badge
            className="absolute left-1/2 -translate-x-1/2 -top-5 z-20 bg-amber-400 text-amber-900 font-bold text-sm px-4 py-1 rounded-full shadow-lg border-2 border-white"
            style={{ pointerEvents: "none" }}
          >
            <span role="img" aria-label="fire">🔥</span> Most Popular
          </Badge>
          <PricingTable
            appearance={{
              elements: {
                rootBox: "flex flex-col md:flex-row justify-center gap-8 w-full",
                card: "w-full min-w-0 max-w-full md:min-w-[320px] md:max-w-[350px] flex-1",
                "card__Reslo_premium": "shadow-2xl border-2 border-purple-500 scale-105 z-10",
                "card__Reslo_standard": "shadow-md border border-gray-300",
                "button__Reslo_premium": "bg-purple-600 hover:bg-purple-700 text-white font-bold",
                "button__Reslo_standard": "bg-gray-200 text-gray-700 font-semibold",
                "button__free_user": "bg-gray-100 text-gray-400 font-semibold",
                "card__free_user": "hidden",
              },
              variables: {
                colorPrimary: "#5e5fee",
              }
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default Pricing; 