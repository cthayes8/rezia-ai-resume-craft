"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import {
  Brain,
  Zap,
  Target,
  PenTool,
} from "lucide-react";

const benefits = [
  {
    icon: Brain,
    title: "AI That Understands Hiring",
    description:
      "Reslo knows what recruiters and ATS bots actually look for—and tailors your resume accordingly.",
  },
  {
    icon: Zap,
    title: "Built for Speed",
    description:
      "Get results in seconds, not hours. No prompts, no editing—just better resumes instantly.",
  },
  {
    icon: Target,
    title: "Tailored to Each Job",
    description:
      "We rewrite your resume to match every job description, so you stand out every single time.",
  },
  {
    icon: PenTool,
    title: "Built-In Cover Letters",
    description:
      "Automatically generate a matching, job-specific cover letter with tone and keywords to match.",
  },
];

const WhyChooseUs = () => (
  <section className="py-20 bg-gray-50">
    <div className="container mx-auto px-4">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <Badge className="mb-2 bg-reslo-blue/10 text-reslo-blue border-none uppercase tracking-wide">
          Why Choose Us
        </Badge>
        <h2 className="text-3xl font-bold mb-4">
        Why Reslo Gets You More Interviews
        </h2>
        <p className="text-gray-600">
        Reslo tailors your resume for every role—using real recruiter language, lightning-fast AI, and proven strategies to help you stand out and get seen.
        </p>
      </div>

      {/* Grid of Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((benefit, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <benefit.icon className="h-6 w-6 text-reslo-blue mb-4" />
            <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
            <p className="text-sm text-gray-600">{benefit.description}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <Button
          asChild
          className="bg-reslo-blue hover:bg-reslo-blue/90 text-white font-semibold px-6 py-3 rounded-lg shadow transition"
        >
          <a href="/sign-up">Try Reslo Free → Optimize Your Resume</a>
        </Button>
      </div>
    </div>
  </section>
);

export default WhyChooseUs;
