'use client';

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LogoCarousel from "@/components/LogoCarousel";
import Features from "@/components/Features";
import WhyChooseUs from "@/components/WhyChooseUs";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const companyLogos = [
  { id: "coinbase", description: "Coinbase", image: "/logos/coinbase.svg", className: "h-7 w-auto" },
  { id: "nbc", description: "NBC", image: "/logos/nbc.svg", className: "h-7 w-auto" },
  { id: "cisco", description: "Cisco", image: "/logos/cisco.svg", className: "h-7 w-auto" },
  { id: "salesforce", description: "Salesforce", image: "/logos/salesforce.svg", className: "h-7 w-auto" },
  { id: "spotify", description: "Spotify", image: "/logos/spotify.svg", className: "h-7 w-auto" },
  { id: "square", description: "Square", image: "/logos/square.svg", className: "h-7 w-auto" },
  { id: "google", description: "Google", image: "/logos/google.svg", className: "h-7 w-auto" },
  { id: "spacex", description: "SpaceX", image: "/logos/spacex.svg", className: "h-7 w-auto" },
  { id: "anthropic", description: "Anthropic", image: "/logos/anthropic.svg", className: "h-7 w-auto" },
  { id: "tesla", description: "Tesla", image: "/logos/tesla.svg", className: "h-7 w-auto" },
  { id: "meta", description: "Meta", image: "/logos/meta.svg", className: "h-7 w-auto" },
  { id: "nvidia", description: "Nvidia", image: "/logos/nvidia.svg", className: "h-7 w-auto" },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <LogoCarousel logos={companyLogos} />
      <Features />
      <WhyChooseUs />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
