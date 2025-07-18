import { Mail, Phone } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1">
            <img 
              src="/Reslo_Logo_long.png" 
              alt="Reslo Logo" 
              className="h-10 w-auto mb-4" 
            />
            <p className="text-gray-600 mb-4">
              AI-powered resume optimization to help you land your dream job.
            </p>
            <div className="flex gap-6 mt-6">
              {/* X (Twitter) */}
              <a href="https://x.com/ResloAi" target="_blank" rel="noopener noreferrer" aria-label="X">
                <img
                  src="/social_logos/x (1).svg"
                  alt="X"
                  className="w-7 h-7 text-gray-400 hover:text-reslo-blue transition"
                />
              </a>
              {/* TikTok */}
              <a href="https://www.tiktok.com/@resloai" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <img
                  src="/social_logos/tiktok (1).svg"
                  alt="TikTok"
                  className="w-7 h-7 text-gray-400 hover:text-reslo-blue transition"
                />
              </a>
              {/* Instagram */}
              <a href="https://instagram.com/yourprofile" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <img
                  src="/social_logos/instagram.svg"
                  alt="Instagram"
                  className="w-7 h-7 text-gray-400 hover:text-reslo-blue transition"
                />
              </a>
            </div>
          </div>
          
          <div className="col-span-1">
            <h3 className="font-semibold text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-600 hover:text-reslo-blue">Features</a></li>
              <li><a href="#pricing" className="text-gray-600 hover:text-reslo-blue">Pricing</a></li>
              <li><a href="#testimonials" className="text-gray-600 hover:text-reslo-blue">Testimonials</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://Reslo-ai.ghost.io" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-reslo-blue">
                  Blog
                </a>
              </li>
              <li><a href="#faq" className="text-gray-600 hover:text-reslo-blue">FAQ</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@Reslo.ai" className="text-gray-600 hover:text-reslo-blue flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>support@Reslo.ai</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Reslo. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/legal/privacy-policy" className="text-gray-500 text-sm hover:text-reslo-blue">
                Privacy Policy
              </Link>
              <Link href="/legal/terms-of-use" className="text-gray-500 text-sm hover:text-reslo-blue">
                Terms of Service
              </Link>
              <Link href="/legal/cookie-policy" className="text-gray-500 text-sm hover:text-reslo-blue">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
