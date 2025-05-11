import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Upload Your Resume",
    description: "Upload your existing resume in any common format (PDF, Word, etc.).",
    image: "bg-gradient-to-br from-purple-100 to-blue-50"
  },
  {
    number: "02",
    title: "Add Job Description",
    description: "Paste the job description you're applying for so our AI can analyze it.",
    image: "bg-gradient-to-br from-blue-100 to-teal-50"
  },
  {
    number: "03",
    title: "Receive Optimized Resume",
    description: "Get your tailored resume with suggested improvements to match the job requirements.",
    image: "bg-gradient-to-br from-teal-100 to-green-50"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block rounded-full bg-rezia-blue px-4 py-1.5 text-xs font-semibold text-white mb-4">
            How it works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How Rezia Works</h2>
          <p className="text-lg text-gray-700">
            Optimizing your resume with Rezia is simple and takes just minutes. Follow these three easy steps to create job-specific resumes that get results.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-12 h-4 -ml-6 z-0">
                  <ArrowRight className="w-12 h-5 text-gray-300" />
                </div>
              )}
              <div className="animate-fade-in" style={{animationDelay: `${index * 0.3}s`}}>
                <div className={`mb-6 rounded-xl h-40 flex items-center justify-center ${step.image}`}>
                  <span className="text-5xl font-bold text-rezia-blue/50">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
