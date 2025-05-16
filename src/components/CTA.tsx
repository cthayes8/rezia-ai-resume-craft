import { Button } from "@/components/ui/button";
import Link from "next/link";

const CTA = () => {
  return (
    <section className="py-20 bg-reslo-blue text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-lg opacity-90 mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
          Thousands are landing interviews they used to get ghosted from — powered by Reslo's AI resume rewrites.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{animationDelay: '0.4s'}}>
            <Button asChild className="bg-white text-reslo-blue hover:bg-white/90 text-lg h-12 px-8">
              <Link href="/sign-up">Start Optimizing for Free</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
