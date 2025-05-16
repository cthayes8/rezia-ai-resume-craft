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
    title: "Scan for Weaknesses Instantly",
    description:
      "Reslo's AI finds what recruiters will flag — missing keywords, vague language, and weak phrasing — and fixes it fast.",
  },
  {
    icon: <Star className="h-10 w-10 text-reslo-blue" />,
    title: "Beat the Filters Automatically",
    description:
      "Reslo rewrites your resume with the exact phrases ATS filters are looking for — so you get seen, not screened out.",
  },
  {
    icon: <CheckCircle className="h-10 w-10 text-reslo-blue" />,
    title: "Sound Like the Perfect Candidate",
    description:
      "Reslo rewrites your resume with recruiter-style language that positions you as the top fit for the job — and gets you interviews.",
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
          Tailored for Every Job. Every Time.
          </h2>
          <p className="text-lg text-gray-700">
          You shouldn’t send the same resume to every job.
          Reslo tailors it perfectly—for every role you apply to.
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
          <h3 className="text-2xl md:text-3xl font-bold mb-6">
          Get More Interviews. With AI That Speaks Recruiter.
          </h3>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
          Reslo rewrites your resume using phrasing recruiters actually use—so you pass filters and get seen.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
