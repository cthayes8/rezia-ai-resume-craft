
import { FileText, CheckCircle, Star } from "lucide-react";

const features = [
  {
    icon: <FileText className="h-10 w-10 text-rezia-blue" />,
    title: "Smart Resume Analysis",
    description:
      "Our AI analyzes your resume against job descriptions to identify missing keywords, skills, and experiences that matter most to employers.",
  },
  {
    icon: <Star className="h-10 w-10 text-rezia-blue" />,
    title: "ATS Keyword Optimization",
    description:
      "Beat the Applicant Tracking Systems by automatically optimizing your resume with the exact keywords and phrases needed to get past the first screening.",
  },
  {
    icon: <CheckCircle className="h-10 w-10 text-rezia-blue" />,
    title: "Personalized Suggestions",
    description:
      "Receive tailored recommendations to strengthen your resume's impact with job-specific language that resonates with hiring managers.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Intelligent Resume Optimization
          </h2>
          <p className="text-lg text-gray-700">
            Rezia leverages AI to transform your resume into a powerful tool that gets you noticed by employers and applicant tracking systems.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card animate-fade-in" 
              style={{animationDelay: `${index * 0.2}s`}}
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center animate-fade-in" style={{animationDelay: '0.6s'}}>
          <div className="inline-block rounded-full bg-rezia-blue/10 px-4 py-1.5 text-sm font-medium text-rezia-blue mb-4">
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
