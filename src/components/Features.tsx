import { FileText, CheckCircle, Star } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const features = [
  {
    icon: <FileText className="h-10 w-10 text-reslo-blue" />,
    title: "Analyze Your Resume",
    description:
      "AI scans for missing keywords, skills, and job matches instantly.",
  },
  {
    icon: <Star className="h-10 w-10 text-reslo-blue" />,
    title: "Boost Your ATS Score",
    description:
      "Match exact phrases needed to pass the first screening.",
  },
  {
    icon: <CheckCircle className="h-10 w-10 text-reslo-blue" />,
    title: "Rewrite Like a Recruiter",
    description:
      "Get language that resonates with hiring managers — instantly.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block rounded-full bg-reslo-blue px-4 py-1.5 text-xs font-semibold text-white mb-4">
            Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            Intelligent Resume Optimization
          </h2>
          <p className="text-lg text-gray-700">
            Reslo leverages AI to transform your resume into a powerful tool that gets you noticed by employers and applicant tracking systems.
          </p>
        </div>

        <div className="block md:hidden">
          <Accordion type="single" collapsible>
            {features.map((feature, index) => (
              <AccordionItem key={index} value={`feature-${index}`}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3">
                    {feature.icon}
                    <span className="text-base font-semibold">{feature.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-600">{feature.description}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card animate-fade-in transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl bg-white rounded-lg p-6"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center animate-fade-in" style={{animationDelay: '0.6s'}}>
          <div className="inline-block rounded-full bg-reslo-blue/10 px-4 py-1.5 text-sm font-medium text-reslo-blue mb-4">
            Powered by advanced machine learning
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-6">
            The smarter way to tailor your resume for each application
          </h3>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Job markets are competitive. Stand out by presenting the most relevant
            version of your professional experience for every opportunity.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
