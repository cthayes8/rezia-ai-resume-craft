"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does Rezia optimize my resume?",
    answer:
      "Rezia reads your resume the way recruiters and ATS systems do. It identifies missing keywords, rewrites your bullets, and boosts the content so it better matches the job you're applying for—helping you land more interviews.",
  },
  {
    question: "What do I get for free?",
    answer:
      "You get one full resume optimization, including personalized keyword matching, bullet rewrites, and formatting improvements. No credit card required. It's the perfect way to try Rezia before upgrading.",
  },
  {
    question: "How much does Rezia cost?",
    answer:
      "After your free resume optimization, you can upgrade to Rezia Standardfor $29.99/month. This includes unlimited resume optimizations, job-specific rewrites, and document downloads.",
  },
  {
    question: "Does Rezia also generate cover letters?",
    answer:
      "Yes. Rezia Premium includes one-click cover letter generation tailored to your optimized resume and the job description—written in your tone, instantly.",
  },
  {
    question: "Can I use Rezia for multiple job applications?",
    answer:
      "Absolutely. Rezia is designed to optimize your resume for each job you apply to. Pro users can create unlimited resume versions, each one tailored to a different opportunity.",
  },
  {
    question: "Is my resume data secure?",
    answer:
      "Yes. We use bank-level encryption to protect your resume data. Your information is never shared with third parties, and you can request deletion at any time.",
  },
  {
    question: "Can Rezia help with career transitions?",
    answer:
      "Definitely. Rezia is great for career changers. It helps surface transferable skills, reframes your experience for new roles, and writes language that resonates with hiring managers in your target industry.",
  },
  {
    question: "Does Rezia work with all resume formats?",
    answer:
      "Yes. We support Word (.doc and .docx) and PDF files. No matter how your resume starts, we'll help you upgrade it.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-700">
            Everything you need to know about using Rezia to upgrade your resume.
          </p>
        </div>

        {/* Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-gray-200"
              >
                <AccordionTrigger className="text-left font-medium py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Support CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-2">Still have questions?</p>
          <a
            href="#"
            className="text-rezia-blue font-medium hover:underline"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
