
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 shadow-sm backdrop-blur-sm py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/2129f9cc-86c3-4db8-b827-5c01659ad64b.png" 
            alt="Rezia Logo" 
            className="h-10 w-auto" 
          />
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-700 hover:text-rezia-blue font-medium transition">Features</a>
          <a href="#how-it-works" className="text-gray-700 hover:text-rezia-blue font-medium transition">How It Works</a>
          <a href="#testimonials" className="text-gray-700 hover:text-rezia-blue font-medium transition">Testimonials</a>
          <a href="#faq" className="text-gray-700 hover:text-rezia-blue font-medium transition">FAQ</a>
        </nav>

        <div className="hidden md:flex space-x-4">
          <Button variant="outline" className="border-rezia-blue text-rezia-blue hover:bg-rezia-blue/10">
            Log in
          </Button>
          <Button className="bg-rezia-blue hover:bg-rezia-blue/90">
            Get Started
          </Button>
        </div>

        <button 
          className="md:hidden text-gray-700" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t absolute w-full left-0 right-0 px-4 py-6 shadow-md">
          <nav className="flex flex-col space-y-4">
            <a 
              href="#features" 
              className="text-gray-700 hover:text-rezia-blue font-medium" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="text-gray-700 hover:text-rezia-blue font-medium" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a 
              href="#testimonials" 
              className="text-gray-700 hover:text-rezia-blue font-medium" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Testimonials
            </a>
            <a 
              href="#faq" 
              className="text-gray-700 hover:text-rezia-blue font-medium" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              FAQ
            </a>
            <div className="flex flex-col space-y-2 pt-2">
              <Button variant="outline" className="w-full border-rezia-blue text-rezia-blue">
                Log in
              </Button>
              <Button className="w-full bg-rezia-blue hover:bg-rezia-blue/90">
                Get Started
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
