
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-20 bg-rezia-blue text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-lg opacity-90 mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
            Join thousands of job seekers who are getting more interviews with Rezia's AI-powered resume optimization.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{animationDelay: '0.4s'}}>
            <Button asChild className="bg-white text-rezia-blue hover:bg-white/90 text-lg h-12 px-8">
              <Link to="/get-started">Start Optimizing for Free</Link>
            </Button>
            <Button asChild variant="outline" className="border-white text-white hover:bg-white/10 text-lg h-12 px-8">
              <Link to="/get-started">View Pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
