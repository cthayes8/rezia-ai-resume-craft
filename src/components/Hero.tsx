import { Button } from "@/components/ui/button";
import Link from 'next/link';
import TrustedAvatarGroup from "@/components/TrustedAvatarGroup";
import React, { useEffect, useState } from "react";

const Hero = () => {
  // Animated FOMO number
  const [jobSeekers, setJobSeekers] = useState(7421);

  useEffect(() => {
    // Animate the number up between 7421 and 7499, then loop back to 7421
    const interval = setInterval(() => {
      setJobSeekers((prev) => {
        let change = Math.floor(Math.random() * 3) + 1; // increment by 1-3
        let next = prev + change;
        if (next > 7499) next = 7421; // loop back to start
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white">
      {/* Faint blue bloom, bottom right */}
      <div className="absolute right-[-20%] bottom-[-20%] w-[700px] h-[700px] bg-reslo-blue/10 rounded-full blur-[120px] pointer-events-none"></div>
      {/* Faint turquoise bloom, top left */}
      <div className="absolute left-[-15%] top-[-15%] w-[500px] h-[500px] bg-reslo-turquoise/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-fade-in">
            {/* Badge */}
            <div className="inline-block rounded-full bg-reslo-blue px-4 py-1.5 text-sm font-semibold text-white mb-8 shadow-lg">
              AI-Powered Resume Optimization
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight hero-headline drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]">
              Your Resume Isn't Rejected —{' '}
              <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-reslo-blue to-reslo-turquoise">
              It's Invisible to Hiring Managers.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Reslo rewrites yours to pass AI filters and land real interviews — in under 60 seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button className="bg-reslo-blue hover:bg-reslo-turquoise text-white text-lg h-14 px-8 rounded-full shadow-xl transition-all duration-300 w-full sm:w-auto">
                Get My Free Optimization
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex flex-col items-center gap-2">
              <TrustedAvatarGroup />
              <div className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                <span className="text-green-500">✔️</span>
                Used by <span className="text-reslo-blue font-bold">{jobSeekers.toLocaleString()}</span> job seekers this week
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
