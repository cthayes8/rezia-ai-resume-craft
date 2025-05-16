import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Upload Resume + Job Description",
    description: "Reslo dissects both documents to understand your experience and what the job requires.",
    image: "bg-gradient-to-br from-purple-100 to-blue-50"
  },
  {
    number: "02",
    title: "Get a Tailored Rewrite",
    description: "Our AI restructures your resume line by line to match the job description—improving phrasing, keywords, and relevance.",
    image: "bg-gradient-to-br from-blue-100 to-teal-50"
  },
  {
    number: "03",
    title: "See Your Score & Download",
    description: "Instant match scoring shows how well your resume aligns. Download the optimized version and apply with confidence.",
    image: "bg-gradient-to-br from-teal-100 to-green-50"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block rounded-full bg-reslo-blue px-4 py-1.5 text-xs font-semibold text-white mb-4">
          How Reslo Works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Tailored in Seconds. Powered by AI.</h2>
          <p className="text-lg text-gray-700">
          Paste your job description. Upload your resume. Our AI restructures it to match the role, boosts your match score, and gets you ready to apply.
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
                  <span className="text-5xl font-bold text-reslo-blue/50">{step.number}</span>
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
