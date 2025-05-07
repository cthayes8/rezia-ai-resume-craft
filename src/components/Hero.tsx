
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-32 overflow-hidden">
      <div className="hero-glow"></div>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-10 mb-12 md:mb-0 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-gradient">AI-Powered</span> Resume Optimization
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-lg">
              Get more interviews with a resume perfectly tailored to each job you apply for. Rezia AI analyzes job descriptions and optimizes your resume to match what employers are looking for.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-rezia-blue hover:bg-rezia-blue/90 text-lg h-12 px-6">
                Try for Free
              </Button>
              <Button variant="outline" className="border-rezia-blue text-rezia-blue hover:bg-rezia-blue/10 text-lg h-12 px-6">
                Learn More
              </Button>
            </div>
            <div className="mt-12 hidden md:block">
              <a href="#how-it-works" className="inline-flex items-center text-gray-500 hover:text-rezia-blue transition-colors">
                <span className="mr-2">See how it works</span>
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </a>
            </div>
          </div>
          <div className="md:w-1/2 relative animate-fade-in" style={{animationDelay: '0.3s'}}>
            <div className="relative bg-white rounded-2xl shadow-lg p-4 border border-gray-100 z-10">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <div className="text-sm text-gray-500 ml-2">Resume Optimization</div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <div className="h-2 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <div className="h-2 bg-gray-200 rounded w-2/5 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                  </div>
                  <div className="bg-rezia-blue/10 rounded p-3 border border-rezia-blue/30">
                    <div className="flex justify-between mb-1">
                      <div className="h-2 bg-rezia-blue/40 rounded w-1/4"></div>
                      <div className="h-2 bg-rezia-blue/40 rounded w-1/6"></div>
                    </div>
                    <div className="h-2 bg-rezia-blue/40 rounded w-11/12"></div>
                  </div>
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <div className="h-2 bg-gray-200 rounded w-3/5 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="h-8 bg-rezia-blue rounded-md w-1/3"></div>
                </div>
              </div>
            </div>
            <div className="absolute top-8 -right-4 w-20 h-20 bg-rezia-turquoise/30 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-rezia-blue/30 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
