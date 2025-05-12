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
      "Rezia knows what recruiters and ATS bots are looking for—and tailors your resume accordingly.",
  },
  {
    icon: Zap,
    title: "Built for Speed",
    description:
      "Optimize your resume in seconds, not hours. No prompts, no guesswork—just results.",
  },
  {
    icon: Target,
    title: "Laser-Focused on Each Job",
    description:
      "Rezia matches your resume to each job description, so you stand out every time you apply.",
  },
  {
    icon: PenTool,
    title: "Includes Cover Letters",
    description:
      "Automatically generate tailored, job-specific cover letters with a tone that matches your resume.",
  },
];

const WhyChooseUs = () => (
  <section className="py-20 bg-gray-50">
    <div className="container mx-auto px-4">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <Badge className="mb-2 bg-rezia-blue/10 text-rezia-blue border-none uppercase tracking-wide">
          Why Choose Us
        </Badge>
        <h2 className="text-3xl font-bold mb-4">
          Why Job Seekers Choose Rezia
        </h2>
        <p className="text-gray-600">
          Rezia isn't just another resume tool. We combine expert strategy with
          cutting-edge AI to help you stand out in a sea of applicants—faster,
          easier, and smarter than ever.
        </p>
      </div>

      {/* Grid of Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((benefit, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <benefit.icon className="h-6 w-6 text-rezia-blue mb-4" />
            <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
            <p className="text-sm text-gray-600">{benefit.description}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <Button
          asChild
          className="bg-rezia-blue hover:bg-rezia-blue/90 text-white font-semibold px-6 py-3 rounded-lg shadow transition"
        >
          <a href="/sign-up">Try Rezia Free → Optimize Your Resume</a>
        </Button>
      </div>
    </div>
  </section>
);

export default WhyChooseUs;
